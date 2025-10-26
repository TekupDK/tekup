import 'reflect-metadata';
import { config as dotenvConfig } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { setupSwagger } from './swagger';
import { AppModule } from './app.module';
import { loadConfig, logConfig } from '@tekup/config';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-secure-platform-src-main-');


async function bootstrap() {
  // Load environment variables from .env and .env.<NODE_ENV>
  dotenvConfig();
  const { config } = loadConfig({ onError: (errs)=>logger.error('[secure-platform:config:error]', errs) });
  logConfig('secure-platform:config');
  const app = await NestFactory.create(AppModule);
  const portStr = process.env.PORT || config.PX_API_PORT || '4010';
  const port = parseInt(portStr, 10);
  setupSwagger(app);

  await app.listen(port);
  // eslint-disable-next-line no-console
  logger.info(`Secure Platform running on http://localhost:${port}`);
}
bootstrap();
