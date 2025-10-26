import pino from 'pino';
import { loadConfig } from '@tekup-ai/vault-core';

const config = loadConfig();

export const logger = pino({
  level: config.LOG_LEVEL
});
