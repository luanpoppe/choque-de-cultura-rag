import { Global, Module } from '@nestjs/common';
import { CoreModule } from '@core/core.module';
import { AiService } from './ai.service';

@Global()
@Module({
  imports: [CoreModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
