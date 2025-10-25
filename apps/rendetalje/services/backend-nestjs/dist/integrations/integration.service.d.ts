import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
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
export declare class IntegrationService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private circuitBreakers;
    private readonly FAILURE_THRESHOLD;
    private readonly RECOVERY_TIMEOUT;
    private readonly REQUEST_TIMEOUT;
    constructor(httpService: HttpService, configService: ConfigService);
    makeRequest<T>(serviceName: string, config: IntegrationConfig, endpoint: string, options?: AxiosRequestConfig): Promise<T>;
    get<T>(serviceName: string, config: IntegrationConfig, endpoint: string): Promise<T>;
    post<T>(serviceName: string, config: IntegrationConfig, endpoint: string, data: any): Promise<T>;
    put<T>(serviceName: string, config: IntegrationConfig, endpoint: string, data: any): Promise<T>;
    patch<T>(serviceName: string, config: IntegrationConfig, endpoint: string, data: any): Promise<T>;
    delete<T>(serviceName: string, config: IntegrationConfig, endpoint: string): Promise<T>;
    getServiceHealth(serviceName: string): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        circuitBreakerState: string;
        failures: number;
        lastFailureTime?: Date;
    };
    getAllServicesHealth(): Record<string, any>;
    private canMakeRequest;
    private onSuccess;
    private onFailure;
}
