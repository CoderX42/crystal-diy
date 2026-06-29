import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse = exception instanceof HttpException ? exception.getResponse() : '服务异常';
    const message = typeof errorResponse === 'string' ? errorResponse : (errorResponse as { message?: string | string[] }).message;

    response.status(status).json({
      code: status,
      message: Array.isArray(message) ? message.join('; ') : message || '服务异常',
      data: null,
    });
  }
}
