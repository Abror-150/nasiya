import { Module } from '@nestjs/common';
import { MijozService } from './mijoz.service';
import { MijozController } from './mijoz.controller';
import { AuthModule } from '../auth/auth.module';
import { TolovlarModule } from '../tolovlar/tolovlar.module';

@Module({
  imports: [AuthModule, TolovlarModule],
  controllers: [MijozController],
  providers: [MijozService],
})
export class MijozModule {}
