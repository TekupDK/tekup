import { Injectable, Logger } from '@nestjs/common';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '@tekup/config';
import { randomBytes } from 'crypto';

@Injectable()
export class ConfigInitService {
  private readonly logger = new Logger(ConfigInitService.name);

  ensureJwtSecret(): void {
    const envLocalPath = join(process.cwd(), '.env.local');
    const envPath = join(process.cwd(), '.env');
    const existing = this.readEnvFile(envLocalPath) || this.readEnvFile(envPath) || '';
    if (existing.includes('JWT_SECRET=')) return;
    const secret = this.generateSecret();
    const line = `JWT_SECRET=${secret}`;
    const targetPath = existsSync(envLocalPath) ? envLocalPath : envPath;
    const newContent = (existing ? existing + '\n' : '') + line + '\n';
    writeFileSync(targetPath, newContent, { encoding: 'utf-8' });
    this.logger.log(`Generated JWT secret and wrote to ${targetPath}`);
  }

  readEnvFile(path: string): string | null {
    try {
      if (!existsSync(path)) return null;
      return readFileSync(path, 'utf-8');
    } catch {
      return null;
    }
  }

  generateSecret(): string {
    return randomBytes(64).toString('base64url');
  }

  logRedactedConfig(): void {
    try {
      const { redacted } = loadConfig();
      this.logger.log(`Loaded config: ${JSON.stringify(redacted)}`);
    } catch (e) {
      this.logger.warn(`Config validation failed: ${(e as Error).message}`);
    }
  }
}

