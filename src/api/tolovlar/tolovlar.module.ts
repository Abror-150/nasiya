import { Module } from '@nestjs/common';
import { TolovlarService } from './tolovlar.service';
import { TolovlarController } from './tolovlar.controller';

@Module({
  controllers: [TolovlarController],
  providers: [TolovlarService],
  exports: [TolovlarService],
})
export class TolovlarModule {}
