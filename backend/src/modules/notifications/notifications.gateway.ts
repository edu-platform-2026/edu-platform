import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 通知 WebSocket 网关
 * 使用 Socket.io 实现实时通知推送
 *
 * 支持：
 * - 按用户推送：发送给指定用户
 * - 按角色推送：发送给指定角色的所有用户
 * - 按班级推送：发送给指定班级的所有学生和家长
 * - 全局广播：发送给机构下所有在线用户
 *
 * 事件说明：
 * 客户端 -> 服务端：
 *   - authenticate：认证，携带 JWT token
 *   - join_room：加入房间（如班级房间）
 *   - mark_read：标记通知已读
 *
 * 服务端 -> 客户端：
 *   - notification：新通知推送
 *   - unread_count：未读通知数量更新
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  /** 在线用户映射：userId -> Set<socketId> */
  private onlineUsers: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * 客户端连接处理
   * @param client 连接的客户端 Socket
   */
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('客户端连接未携带 token，断开连接');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.institutionId = payload.institutionId;

      if (!this.onlineUsers.has(payload.sub)) {
        this.onlineUsers.set(payload.sub, new Set());
      }
      this.onlineUsers.get(payload.sub).add(client.id);

      client.join(`institution:${payload.institutionId}`);
      client.join(`user:${payload.sub}`);

      this.logger.log(`用户 ${payload.sub} 已连接，Socket ID: ${client.id}`);
    } catch (error) {
      this.logger.error(`客户端连接认证失败: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * 客户端断开连接处理
   * @param client 断开的客户端 Socket
   */
  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;

    if (userId && this.onlineUsers.has(userId)) {
      this.onlineUsers.get(userId).delete(client.id);
      if (this.onlineUsers.get(userId).size === 0) {
        this.onlineUsers.delete(userId);
      }
    }

    this.logger.log(`客户端断开连接: ${client.id}`);
  }

  /**
   * 处理客户端认证消息
   */
  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string },
  ) {
    try {
      const payload = this.jwtService.verify(data.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.institutionId = payload.institutionId;
      client.join(`user:${payload.sub}`);

      return { event: 'authenticated', data: { userId: payload.sub } };
    } catch (error) {
      return { event: 'auth_error', data: { message: '认证失败' } };
    }
  }

  /**
   * 处理加入房间请求（如班级房间）
   */
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.join(data.room);
    this.logger.log(`用户 ${client.data.userId} 加入房间: ${data.room}`);
    return { event: 'joined_room', data: { room: data.room } };
  }

  /**
   * 处理离开房间请求
   */
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.leave(data.room);
    this.logger.log(`用户 ${client.data.userId} 离开房间: ${data.room}`);
    return { event: 'left_room', data: { room: data.room } };
  }

  // ==================== 通知推送方法 ====================

  /**
   * 向指定用户推送通知
   * @param userId 用户 ID
   * @param notification 通知数据
   */
  sendToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.debug(`通知已推送给用户: ${userId}`);
  }

  /**
   * 向指定角色的用户推送通知
   * @param institutionId 机构 ID
   * @param roleCode 角色编码
   * @param notification 通知数据
   */
  async sendToRole(institutionId: string, roleCode: string, notification: any) {
    const users = await this.prisma.user.findMany({
      where: {
        institutionId,
        status: 1,
        userRoles: {
          some: { role: { code: roleCode } },
        },
      },
      select: { id: true },
    });

    users.forEach((user) => {
      this.sendToUser(user.id, notification);
    });

    this.logger.debug(`通知已推送给角色 ${roleCode} 的 ${users.length} 个用户`);
  }

  /**
   * 向班级的所有学生和家长推送通知
   * @param classId 班级 ID
   * @param notification 通知数据
   */
  async sendToClass(classId: string, notification: any) {
    const classStudents = await this.prisma.classStudent.findMany({
      where: { classId },
      select: { studentId: true, parentId: true },
    });

    const userIds = new Set<string>();
    classStudents.forEach((cs) => {
      userIds.add(cs.studentId);
      if (cs.parentId) userIds.add(cs.parentId);
    });

    userIds.forEach((userId) => {
      this.sendToUser(userId, notification);
    });

    this.logger.debug(`通知已推送给班级 ${classId} 的 ${userIds.size} 个用户`);
  }

  /**
   * 向机构下所有在线用户广播通知
   * @param institutionId 机构 ID
   * @param notification 通知数据
   */
  broadcastToInstitution(institutionId: string, notification: any) {
    this.server
      .to(`institution:${institutionId}`)
      .emit('notification', notification);
    this.logger.debug(`通知已广播给机构 ${institutionId} 的所有在线用户`);
  }

  /**
   * 推送未读通知数量更新
   * @param userId 用户 ID
   * @param unreadCount 未读数量
   */
  sendUnreadCount(userId: string, unreadCount: number) {
    this.server.to(`user:${userId}`).emit('unread_count', { unreadCount });
  }

  /**
   * 获取在线用户数量
   */
  getOnlineUserCount(): number {
    return this.onlineUsers.size;
  }

  /**
   * 检查用户是否在线
   * @param userId 用户 ID
   */
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}
