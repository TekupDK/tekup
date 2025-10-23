import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Don't report HTTP errors (they're expected)
        if (!(error instanceof HttpException)) {
          const request = context.switchToHttp().getRequest();
          
          Sentry.withScope((scope) => {
            scope.setContext('request', {
              method: request.method,
              url: request.url,
              headers: this.sanitizeHeaders(request.headers),
              body: this.sanitizeBody(request.body),
            });

            scope.setUser({
              id: request.user?.id,
              email: request.user?.email,
            });

            Sentry.captureException(error);
          });
        }

        return throwError(() => error);
      }),
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    return sanitized;
  }
}
