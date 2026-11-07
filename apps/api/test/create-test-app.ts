import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { AppConfig } from '../src/core/config/app-config';

/** L'application complète, sur une base PGlite en mémoire neuve, migrations appliquées. */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AppConfig)
    .useValue(AppConfig.fromEnv({ NODE_ENV: 'test', PGLITE_DATA_DIR: 'memory://' }))
    .compile();
  const app = moduleRef.createNestApplication({ logger: ['error'] });
  configureApp(app);
  await app.init();
  return app;
}
