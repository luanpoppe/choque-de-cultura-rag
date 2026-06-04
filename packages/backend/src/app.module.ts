import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { ChatModule } from '@modules/chat/chat.module';
import { IngestionModule } from '@modules/ingestion/ingestion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    CoreModule,
    InfrastructureModule,
    IngestionModule,
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
