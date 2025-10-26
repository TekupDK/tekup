import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { DomainError } from './domain-error.js';
import { ValidationError } from 'class-validator';
import { createLogger } from '@tekup/shared';

const logger = createLogger('apps-flow-api-src-common-domai');

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof DomainError) {
      return response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: exception.code, message: exception.message });
    }
    if (Array.isArray(exception?.response?.message)) {
      return response.status(HttpStatus.BAD_REQUEST).json({ error: 'validation_error', details: exception.response.message });
    }
    if (exception instanceof ValidationError) {
      return response.status(HttpStatus.BAD_REQUEST).json({ error: 'validation_error' });
    }
    if (exception?.status === 401 || exception?.status === 403) {
      return response.status(exception.status).json({ error: exception.response?.error || 'unauthorized' });
    }
    // Fallback
    logger.error('Unexpected error', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'internal_error' });
  }
}
