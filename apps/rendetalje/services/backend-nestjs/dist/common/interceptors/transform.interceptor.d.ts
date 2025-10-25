import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SuccessResponseDto } from '../dto/response.dto';
export declare class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponseDto<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponseDto<T>>;
}
