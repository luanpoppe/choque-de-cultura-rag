import { Injectable } from '@nestjs/common';
import { RagService } from '@infrastructure/rag/rag.service';
import type { RagAskResult } from '@infrastructure/rag/rag.types';
import type { ChatRequestDto } from './dto/chat-request.dto';

@Injectable()
export class ChatService {
  constructor(private readonly ragService: RagService) {}

  ask(dto: ChatRequestDto): Promise<RagAskResult> {
    return this.ragService.ask(dto.message, dto.history);
  }
}
