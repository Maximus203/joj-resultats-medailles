import { existsSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { AppConfig } from './core/config/app-config';

async function bootstrap(): Promise<void> {
  // apps/api/.env est facultatif : sans lui, les valeurs par défaut suffisent.
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const port = app.get(AppConfig).get('PORT');
  await app.listen(port);
  new Logger('Bootstrap').log(`API sur http://localhost:${port}/api, doc sur /api/docs`);
}

void bootstrap();
