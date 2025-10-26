export interface SecretsProvider {
  getJwtSecret(): Promise<string> | string;
}

export const SECRETS_PROVIDER = 'SECRETS_PROVIDER';

