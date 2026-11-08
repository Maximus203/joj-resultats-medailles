import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { AppConfig } from '../src/core/config/app-config';

/**
 * L'application complète, sur une base PGlite en mémoire neuve, migrations appliquées. `customize`
 * remplace des fournisseurs (le site officiel simulé, l'horloge) : aucun test ne touche le réseau.
 */
export async function createTestApp(
  customize: (builder: TestingModuleBuilder) => TestingModuleBuilder = (builder) => builder,
): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AppConfig)
    .useValue(AppConfig.fromEnv({ NODE_ENV: 'test', PGLITE_DATA_DIR: 'memory://' }));
  const moduleRef = await customize(builder).compile();
  const app = moduleRef.createNestApplication({ logger: ['error'] });
  configureApp(app);
  await app.init();
  return app;
}
