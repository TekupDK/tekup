import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message?: string;
}
export declare const RateLimit: (config: RateLimitConfig) => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare class RateLimitGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private getKey;
}
export {};
