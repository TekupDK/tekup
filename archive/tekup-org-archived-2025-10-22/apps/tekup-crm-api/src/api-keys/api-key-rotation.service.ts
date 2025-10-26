import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class ApiKeyRotationService {
  private readonly logger = new Logger(ApiKeyRotationService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_WEEK)
  async rotateIfEnabled() {
    if (process.env.APIKEY_ROTATION_ENABLED !== 'true') return;
    this.logger.log('Starting weekly API key rotation');
    // naive example: rotate keys flagged for rotation
    const keys = await this.prisma.ApiKey.findMany({});
    for (const k of keys) {
      if (!k.name.endsWith('-rotate')) continue;
      const raw = randomBytes(32).toString('base64url');
      const hash = createHash('sha256').update(raw).digest('hex');
      await this.prisma.ApiKey.update({ where: { id: k.id }, data: { hash } });
      this.logger.log(`Rotated key ${k.name} for tenant ${k.tenantId}`);
    }
  }
}

