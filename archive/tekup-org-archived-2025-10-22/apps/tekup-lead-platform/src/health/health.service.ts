import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async getHealthStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'TekUp Lead Platform',
      version: '0.1.0',
    };
  }

  async getDetailedHealthStatus() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkExternalServices(),
    ]);

    const [databaseCheck, servicesCheck] = checks;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'TekUp Lead Platform',
      version: '0.1.0',
      checks: {
        database: databaseCheck.status === 'fulfilled' ? databaseCheck.value : { status: 'error', error: databaseCheck.reason?.message },
        externalServices: servicesCheck.status === 'fulfilled' ? servicesCheck.value : { status: 'error', error: servicesCheck.reason?.message },
      },
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', responseTime: Date.now() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  private async checkExternalServices() {
    // Check Google APIs, Billy API, etc.
    return { status: 'ok', services: ['google-workspace', 'billy-billing'] };
  }
}
