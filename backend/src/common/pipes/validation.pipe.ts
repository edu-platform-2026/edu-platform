import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * 自定义参数验证管道
 * 使用 class-validator 进行 DTO 验证
 * 比默认的 ValidationPipe 提供更灵活的错误处理
 */
@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(CustomValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    // 如果没有元类型或基本类型，直接返回
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 将普通对象转换为 DTO 类实例
    const object = plainToInstance(metatype, value);

    // 执行验证
    const errors = await validate(object, {
      whitelist: true, // 过滤掉未定义的属性
      forbidNonWhitelisted: true, // 存在未定义属性时抛出错误
      transform: true, // 自动类型转换
    });

    // 如果有验证错误，抛出格式化的错误信息
    if (errors.length > 0) {
      const messages = errors
        .map((err) => {
          const constraints = err.constraints;
          if (constraints) {
            return Object.values(constraints).join('; ');
          }
          return `${err.property} 验证失败`;
        })
        .join('; ');

      this.logger.warn(`参数验证失败: ${messages}`);
      throw new BadRequestException(`参数验证失败: ${messages}`);
    }

    return object;
  }

  /**
   * 判断是否需要验证
   * 只对自定义类进行验证，基本类型跳过
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
