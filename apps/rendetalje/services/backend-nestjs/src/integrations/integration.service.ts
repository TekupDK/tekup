import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface IntegrationConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  
  // Circuit breaker configuration
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 60000; // 1 minute
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async makeRequest<T>(
    serviceName: string,
    config: IntegrationConfig,
    endpoint: string,
    options: AxiosRequestConfig = {},
  ): Promise<T> {
    // Check circuit breaker
    if (!this.canMakeRequest(serviceName)) {
      throw new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
    }

    const requestConfig: AxiosRequestConfig = {
      ...options,
      url: `${config.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: config.timeout || this.REQUEST_TIMEOUT,
    };

    try {
      this.logger.debug(`Making request to ${serviceName}: ${requestConfig.method?.toUpperCase() || 'GET'} ${requestConfig.url}`);

      const response = await firstValueFrom(
        this.httpService.request<T>(requestConfig).pipe(
          timeout(config.timeout || this.REQUEST_TIMEOUT),
          retry(config.retries || 2),
          catchError((error) => {
            this.logger.error(`Request failed for ${serviceName}:`, error.message);
            throw error;
          }),
        ),
      );

      // Reset circuit breaker on success
      this.onSuccess(serviceName);
      
      this.logger.debug(`Request successful for ${serviceName}: ${response.status}`);
      return response.data;

    } catch (error) {
      // Record failure in circuit breaker
      this.onFailure(serviceName);
      
      this.logger.error(`Integration request failed for ${serviceName}:`, {
        error: error.message,
        endpoint,
        status: error.response?.status,
      });

      throw new Error(`${serviceName} integration failed: ${error.message}`);
    }
  }

  async get<T>(serviceName: string, config: IntegrationConfig, endpoint: string): Promise<T> {
    return this.makeRequest<T>(serviceName, config, endpoint, { method: 'GET' });
  }

  async post<T>(
    serviceName: string,
    config: IntegrationConfig,
    endpoint: string,
    data: any,
  ): Promise<T> {
    return this.makeRequest<T>(serviceName, config, endpoint, {
      method: 'POST',
      data,
    });
  }

  async put<T>(
    serviceName: string,
    config: IntegrationConfig,
    endpoint: string,
    data: any,
  ): Promise<T> {
    return this.makeRequest<T>(serviceName, config, endpoint, {
      method: 'PUT',
      data,
    });
  }

  async patch<T>(
    serviceName: string,
    config: IntegrationConfig,
    endpoint: string,
    data: any,
  ): Promise<T> {
    return this.makeRequest<T>(serviceName, config, endpoint, {
      method: 'PATCH',
      data,
    });
  }

  async delete<T>(serviceName: string, config: IntegrationConfig, endpoint: string): Promise<T> {
    return this.makeRequest<T>(serviceName, config, endpoint, { method: 'DELETE' });
  }

  getServiceHealth(serviceName: string): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    circuitBreakerState: string;
    failures: number;
    lastFailureTime?: Date;
  } {
    const breaker = this.circuitBreakers.get(serviceName);
    
    if (!breaker) {
      return {
        status: 'healthy',
        circuitBreakerState: 'CLOSED',
        failures: 0,
      };
    }

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (breaker.state === 'OPEN') {
      status = 'unhealthy';
    } else if (breaker.failures > 0) {
      status = 'degraded';
    }

    return {
      status,
      circuitBreakerState: breaker.state,
      failures: breaker.failures,
      lastFailureTime: breaker.lastFailureTime ? new Date(breaker.lastFailureTime) : undefined,
    };
  }

  getAllServicesHealth(): Record<string, any> {
    const services = ['tekup-billy', 'tekup-vault', 'renos-calendar', 'ai-friday'];
    const health: Record<string, any> = {};

    services.forEach(service => {
      health[service] = this.getServiceHealth(service);
    });

    return health;
  }

  private canMakeRequest(serviceName: string): boolean {
    const breaker = this.circuitBreakers.get(serviceName);
    
    if (!breaker) {
      return true;
    }

    const now = Date.now();

    switch (breaker.state) {
      case 'CLOSED':
        return true;
      
      case 'OPEN':
        if (now - breaker.lastFailureTime > this.RECOVERY_TIMEOUT) {
          // Transition to HALF_OPEN
          breaker.state = 'HALF_OPEN';
          this.logger.log(`Circuit breaker for ${serviceName} transitioned to HALF_OPEN`);
          return true;
        }
        return false;
      
      case 'HALF_OPEN':
        return true;
      
      default:
        return true;
    }
  }

  private onSuccess(serviceName: string): void {
    const breaker = this.circuitBreakers.get(serviceName);
    
    if (breaker) {
      if (breaker.state === 'HALF_OPEN') {
        // Transition back to CLOSED
        breaker.state = 'CLOSED';
        breaker.failures = 0;
        this.logger.log(`Circuit breaker for ${serviceName} transitioned to CLOSED`);
      } else if (breaker.failures > 0) {
        // Reduce failure count on success
        breaker.failures = Math.max(0, breaker.failures - 1);
      }
    }
  }

  private onFailure(serviceName: string): void {
    let breaker = this.circuitBreakers.get(serviceName);
    
    if (!breaker) {
      breaker = {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED',
      };
      this.circuitBreakers.set(serviceName, breaker);
    }

    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= this.FAILURE_THRESHOLD) {
      breaker.state = 'OPEN';
      this.logger.warn(`Circuit breaker for ${serviceName} opened due to ${breaker.failures} failures`);
    }
  }
}