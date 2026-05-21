import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { Notification } from '../types/api';

export const useRealtime = () => {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((state) => state.token);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);

  useEffect(() => {
    if (!token) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('notification', (data: Notification) => {
      addNotification(data);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, addNotification]);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  return {
    socket: socketRef.current,
    connected: socketRef.current?.connected || false,
    emit,
    on,
  };
};
