import { Module } from '@nestjs/common';
import { MijozService } from './mijoz.service';
import { MijozController } from './mijoz.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MijozController],
  providers: [MijozService],
})
export class MijozModule {}
