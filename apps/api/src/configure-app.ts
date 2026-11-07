import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

/** Configuration HTTP partagée par main.ts et les tests e2e : on teste ce qui tourne vraiment. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('API JOJ Dakar 2026').setVersion('1').build(),
  );
  // Interface Swagger sur /api/docs, document OpenAPI sur /api/docs-json.
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));
}
