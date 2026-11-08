import { z } from 'zod';
import { type Env, envSchema } from './env-schema';

/** Configuration validée une fois, au démarrage : une variable invalide arrête l'API. */
export class AppConfig {
  private constructor(private readonly env: Env) {}

  static fromEnv(source: Record<string, string | undefined>): AppConfig {
    const result = envSchema.safeParse(source);
    if (!result.success) {
      throw new Error(`Configuration invalide :\n${z.prettifyError(result.error)}`);
    }
    return new AppConfig(result.data);
  }

  get<K extends keyof Env>(key: K): Env[K] {
    return this.env[key];
  }
}
