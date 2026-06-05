import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';
import { createSwaggerConfig } from './core/swagger.config';
import { EnvService } from './core/env.service';
import { resolveNestLogLevels } from './core/log-level';
import { LoggingInterceptor } from '@infrastructure/logging/logging.interceptor';

async function bootstrap() {
  const logLevels = resolveNestLogLevels(process.env.LOG_LEVEL);
  const logger = new Logger('Bootstrap');
  Logger.overrideLogger(logLevels);

  logger.log('Starting application...');
  const app = await NestFactory.create(AppModule, { logger: logLevels });

  app.set('trust proxy', 1);

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor());
  logger.log('ZodValidationPipe enabled');
  logger.log(`Log level: ${logLevels.join(', ')}`);

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
