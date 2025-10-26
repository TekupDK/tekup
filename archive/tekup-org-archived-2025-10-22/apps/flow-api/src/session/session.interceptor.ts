import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SessionAffinityService } from './session-affinity.service.js';
import { LoadBalancerHealthService } from '../health/load-balancer-health.service.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SessionInterceptor.name);

  constructor(
    private readonly sessionAffinityService: SessionAffinityService,
    private readonly loadBalancerHealthService: LoadBalancerHealthService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Generate unique request ID for tracking
    const requestId = uuidv4();
    request.id = requestId;
    
    // Track request start
    this.loadBalancerHealthService.trackRequestStart(requestId);
    
    // Handle session affinity if enabled
    this.sessionAffinityService.getSessionAffinity(request, response).catch((error) => {
      this.logger.warn('Failed to establish session affinity:', error);
    });

    // Continue with request processing
    return next.handle().pipe(
      tap({
        next: () => {
          // Track successful response
          this.loadBalancerHealthService.trackRequestEnd(requestId);
        },
        error: (error) => {
          // Track errored response
          this.loadBalancerHealthService.trackRequestEnd(requestId);
          this.logger.error(`Request ${requestId} failed:`, error);
        },
        complete: () => {
          // Track completed response
          this.loadBalancerHealthService.trackRequestEnd(requestId);
        }
      })
    );
  }
}