import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [InfrastructureModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
