import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@Controller('api/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('suggestions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sugestões de perguntas derivadas do acervo indexado',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        suggestions: { type: 'array', items: { type: 'string' } },
        emptyCorpus: { type: 'boolean' },
        panorama: { type: 'string' },
      },
    },
  })
  getSuggestions() {
    return this.onboardingService.getSuggestions();
  }
}
