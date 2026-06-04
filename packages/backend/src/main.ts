import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';
import { createSwaggerConfig } from './core/swagger.config';
import { EnvService } from './core/env.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting application...');
  const app = await NestFactory.create(AppModule);

  app.set('trust proxy', 1);

  app.useGlobalPipes(new ZodValidationPipe());
  logger.log('ZodValidationPipe enabled');

  // Configuração do Swagger
  const config = createSwaggerConfig();
  const document = SwaggerModule.createDocument(app, config);
  const envService = app.get(EnvService);
  if (!envService.getEnvs().SWAGGER_EXPOSE_INTERNAL) {
    for (const path of Object.keys(document.paths ?? {})) {
      if (path.startsWith('/api/internal')) {
        delete document.paths[path];
      }
    }
  }
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(document));
  logger.log('Swagger enabled');

  app.enableCors();
  logger.log('CORS enabled');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Server is running on port ${port}`);
}
void bootstrap();
