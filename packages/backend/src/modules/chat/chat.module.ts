import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { ChatRateLimitGuard } from './chat-rate-limit.guard';
import { ChatRateLimitService } from './chat-rate-limit.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [InfrastructureModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRateLimitService, ChatRateLimitGuard],
})
export class ChatModule {}
