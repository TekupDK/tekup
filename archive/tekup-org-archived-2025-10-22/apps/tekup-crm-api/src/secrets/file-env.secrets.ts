import { SecretsProvider } from './secrets.interface';

export class FileEnvSecretsProvider implements SecretsProvider {
  async getJwtSecret(): Promise<string> {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing');
    return process.env.JWT_SECRET;
  }
}

