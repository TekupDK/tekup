import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

/**
 * Centralized secrets loader for Tekup Portfolio
 * Loads environment variables from C:\Users\empir\tekup-secrets
 */
export class SecretsLoader {
  private static cache: Record<string, string> = {};
  private static readonly SECRETS_ROOT = process.env.TEKUP_SECRETS_PATH || 'C:\\Users\\empir\\tekup-secrets';

  /**
   * Load secrets from centralized location
   * AI agents can call this to get fresh secrets
   * 
   * @param environment - 'production' or 'development'
   * @returns Merged environment variables
   */
  static load(environment: 'production' | 'development' = 'development'): Record<string, string> {
    const files = [
      '.env.shared',
      `.env.${environment}`,
      'config/ai-services.env',
      'config/databases.env',
      'config/google-workspace.env',
      'config/apis.env',
      'config/monitoring.env'
    ];

    const secrets: Record<string, string> = {};

    for (const file of files) {
      const filePath = join(this.SECRETS_ROOT, file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8');
        const parsed = this.parseEnvFile(content);
        Object.assign(secrets, parsed);
      }
    }

    // Cache for subsequent calls
    this.cache = secrets;

    return secrets;
  }

  /**
   * Get specific secret by key
   * 
   * @param key - Environment variable name
   * @param environment - Optional environment override
   * @returns Secret value or undefined
   */
  static get(key: string, environment?: 'production' | 'development'): string | undefined {
    if (Object.keys(this.cache).length === 0) {
      this.load(environment);
    }
    return this.cache[key];
  }

  /**
   * Validate secrets against Zod schema
   * Throws if validation fails
   * 
   * @param schema - Zod schema to validate against
   * @param secrets - Optional secrets object (uses cached if not provided)
   * @returns Validated and typed secrets
   */
  static validate<T extends z.ZodTypeAny>(schema: T, secrets?: Record<string, string>): z.infer<T> {
    const data = secrets || this.load();
    return schema.parse(data);
  }

  /**
   * Check if all required keys exist
   * 
   * @param requiredKeys - Array of required environment variable names
   * @param throwOnMissing - Throw error if keys are missing
   * @returns Missing keys (empty array if all present)
   */
  static checkRequired(requiredKeys: string[], throwOnMissing = false): string[] {
    if (Object.keys(this.cache).length === 0) {
      this.load();
    }

    const missing = requiredKeys.filter(key => !this.cache[key]);

    if (missing.length > 0 && throwOnMissing) {
      throw new Error(`Missing required secrets: ${missing.join(', ')}`);
    }

    return missing;
  }

  /**
   * Inject secrets into process.env
   * Useful for initializing applications
   * 
   * @param environment - 'production' or 'development'
   * @param overwrite - Whether to overwrite existing process.env values
   */
  static injectIntoProcessEnv(environment?: 'production' | 'development', overwrite = false): void {
    const secrets = this.load(environment);

    for (const [key, value] of Object.entries(secrets)) {
      if (overwrite || !process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  /**
   * Clear cached secrets
   * Useful for testing or forcing reload
   */
  static clearCache(): void {
    this.cache = {};
  }

  /**
   * Parse .env file content into key-value pairs
   * Handles comments, quotes, and multiline values
   * 
   * @param content - Raw .env file content
   * @returns Parsed environment variables
   */
  private static parseEnvFile(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      // Split on first = only
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();
      
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Unescape newlines in quoted strings
      value = value.replace(/\\n/g, '\n');
      
      result[key] = value;
    }
    
    return result;
  }
}

/**
 * Example usage:
 * 
 * ```typescript
 * import { SecretsLoader } from '@tekup-ai/config';
 * 
 * // Load all secrets
 * const secrets = SecretsLoader.load('development');
 * 
 * // Get specific secret
 * const openaiKey = SecretsLoader.get('OPENAI_API_KEY');
 * 
 * // Validate with Zod
 * const MyConfigSchema = z.object({
 *   OPENAI_API_KEY: z.string().min(1),
 *   SUPABASE_URL: z.string().url()
 * });
 * const config = SecretsLoader.validate(MyConfigSchema);
 * 
 * // Check required keys
 * SecretsLoader.checkRequired(['OPENAI_API_KEY', 'SUPABASE_URL'], true);
 * 
 * // Inject into process.env (for app initialization)
 * SecretsLoader.injectIntoProcessEnv('development');
 * ```
 */
