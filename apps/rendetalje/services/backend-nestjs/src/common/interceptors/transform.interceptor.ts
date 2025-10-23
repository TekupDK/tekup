import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponseDto } from '../dto/response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // Don't transform if data is already a response DTO
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        return new SuccessResponseDto(data);
      }),
    );
  }
}