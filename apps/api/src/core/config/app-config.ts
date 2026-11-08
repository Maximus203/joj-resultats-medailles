import { Logger } from '@nestjs/common';
import { z } from 'zod';
import { type Env, envSchema, REMOVED_SETTINGS } from './env-schema';

/** Configuration validée une fois, au démarrage : une variable invalide arrête l'API. */
export class AppConfig {
  private constructor(private readonly env: Env) {}

  static fromEnv(source: Record<string, string | undefined>): AppConfig {
    const result = envSchema.safeParse(source);
    if (!result.success) {
      throw new Error(`Configuration invalide :\n${z.prettifyError(result.error)}`);
    }
    for (const [removed, replacement] of Object.entries(REMOVED_SETTINGS)) {
      if (source[removed] !== undefined) {
        new Logger('AppConfig').warn(`${removed} est ignoré : voir ${replacement}`);
      }
    }
    return new AppConfig(result.data);
  }

  get<K extends keyof Env>(key: K): Env[K] {
    return this.env[key];
  }
}
