import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AppConfig } from './config/app-config';
import { DatabaseModule } from './database/database.module';
import { ProblemDetailsFilter } from './errors/problem-details.filter';
import { HealthController } from './health/health.controller';

/** Transverse : configuration, base de données, validation, sérialisation, erreurs, santé. */
@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [
    { provide: AppConfig, useFactory: () => AppConfig.fromEnv(process.env) },
    // Valide chaque DTO créé par createZodDto ; une erreur devient un 400 VALIDATION_FAILED.
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Sérialise les réponses selon @ZodSerializerDto : rien ne sort qui ne soit dans le schéma.
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
  exports: [AppConfig],
})
export class CoreModule {}
