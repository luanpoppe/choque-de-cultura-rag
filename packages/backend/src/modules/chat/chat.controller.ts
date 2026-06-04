import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { ChatRateLimitGuard } from './chat-rate-limit.guard';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@ApiTags('chat')
@UseGuards(ChatRateLimitGuard)
@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perguntar ao acervo do Choque de Cultura',
    description:
      'Resposta com texto e citações verificáveis (vídeo + timestamp). Flags opcionais: noMatch, offTopic.',
  })
  @ApiBody({ type: ChatRequestDto })
  @ApiTooManyRequestsResponse({
    description: 'Limite de requisições por IP excedido',
    schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
    },
  })
  @ApiOkResponse({
    description: 'Resposta do agente RAG',
    schema: {
      type: 'object',
      properties: {
        reply: { type: 'string' },
        citations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              episodeTitle: { type: 'string' },
              youtubeVideoId: { type: 'string' },
              startSec: { type: 'number' },
              durationSec: { type: 'number' },
              quote: { type: 'string' },
              watchUrl: { type: 'string' },
            },
          },
        },
        noMatch: { type: 'boolean' },
        offTopic: { type: 'boolean' },
      },
    },
  })
  chat(@Body() body: ChatRequestDto) {
    return this.chatService.ask(body);
  }
}
