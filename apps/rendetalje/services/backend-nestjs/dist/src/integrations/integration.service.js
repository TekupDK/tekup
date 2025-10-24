"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IntegrationService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let IntegrationService = IntegrationService_1 = class IntegrationService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(IntegrationService_1.name);
        this.circuitBreakers = new Map();
        this.FAILURE_THRESHOLD = 5;
        this.RECOVERY_TIMEOUT = 60000;
        this.REQUEST_TIMEOUT = 30000;
    }
    async makeRequest(serviceName, config, endpoint, options = {}) {
        if (!this.canMakeRequest(serviceName)) {
            throw new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
        }
        const requestConfig = {
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
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.request(requestConfig).pipe((0, rxjs_1.timeout)(config.timeout || this.REQUEST_TIMEOUT), (0, rxjs_1.retry)(config.retries || 2), (0, rxjs_1.catchError)((error) => {
                this.logger.error(`Request failed for ${serviceName}:`, error.message);
                throw error;
            })));
            this.onSuccess(serviceName);
            this.logger.debug(`Request successful for ${serviceName}: ${response.status}`);
            return response.data;
        }
        catch (error) {
            this.onFailure(serviceName);
            this.logger.error(`Integration request failed for ${serviceName}:`, {
                error: error.message,
                endpoint,
                status: error.response?.status,
            });
            throw new Error(`${serviceName} integration failed: ${error.message}`);
        }
    }
    async get(serviceName, config, endpoint) {
        return this.makeRequest(serviceName, config, endpoint, { method: 'GET' });
    }
    async post(serviceName, config, endpoint, data) {
        return this.makeRequest(serviceName, config, endpoint, {
            method: 'POST',
            data,
        });
    }
    async put(serviceName, config, endpoint, data) {
        return this.makeRequest(serviceName, config, endpoint, {
            method: 'PUT',
            data,
        });
    }
    async patch(serviceName, config, endpoint, data) {
        return this.makeRequest(serviceName, config, endpoint, {
            method: 'PATCH',
            data,
        });
    }
    async delete(serviceName, config, endpoint) {
        return this.makeRequest(serviceName, config, endpoint, { method: 'DELETE' });
    }
    getServiceHealth(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker) {
            return {
                status: 'healthy',
                circuitBreakerState: 'CLOSED',
                failures: 0,
            };
        }
        let status = 'healthy';
        if (breaker.state === 'OPEN') {
            status = 'unhealthy';
        }
        else if (breaker.failures > 0) {
            status = 'degraded';
        }
        return {
            status,
            circuitBreakerState: breaker.state,
            failures: breaker.failures,
            lastFailureTime: breaker.lastFailureTime ? new Date(breaker.lastFailureTime) : undefined,
        };
    }
    getAllServicesHealth() {
        const services = ['tekup-billy', 'tekup-vault', 'renos-calendar', 'ai-friday'];
        const health = {};
        services.forEach(service => {
            health[service] = this.getServiceHealth(service);
        });
        return health;
    }
    canMakeRequest(serviceName) {
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
    onSuccess(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (breaker) {
            if (breaker.state === 'HALF_OPEN') {
                breaker.state = 'CLOSED';
                breaker.failures = 0;
                this.logger.log(`Circuit breaker for ${serviceName} transitioned to CLOSED`);
            }
            else if (breaker.failures > 0) {
                breaker.failures = Math.max(0, breaker.failures - 1);
            }
        }
    }
    onFailure(serviceName) {
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
};
exports.IntegrationService = IntegrationService;
exports.IntegrationService = IntegrationService = IntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object, config_1.ConfigService])
], IntegrationService);
//# sourceMappingURL=integration.service.js.map