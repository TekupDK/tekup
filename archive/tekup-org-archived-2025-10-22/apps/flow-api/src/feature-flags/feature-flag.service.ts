import { Injectable } from '@nestjs/common';

// Simple low-cardinality feature flag service (in-memory). For persistence later, move to settings table.
@Injectable()
export class FeatureFlagService {
  private overrides: Map<string, boolean> = new Map();

  // Evaluate a flag: explicit override > env var PX_FLAG_<NAME> > default
  isEnabled(name: string, defaultValue = false): boolean {
    if (this.overrides.has(name)) return this.overrides.get(name)!;
    const envName = `PX_FLAG_${name.toUpperCase()}`;
    const env = process.env[envName];
    if (env != null) {
      return env === '1' || env?.toLowerCase() === 'true';
    }
    return defaultValue;
  }

  setOverride(name: string, value: boolean) {
    this.overrides.set(name, value);
  }

  clearOverride(name: string) {
    this.overrides.delete(name);
  }
}
