import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TolovlarService } from './tolovlar.service';
import { UpdateTolovlarDto } from './dto/update-tolovlar.dto';
import { CreateTolovlarDto } from './dto/createTolovDto';
import { CreateOneMonthDto } from './dto/create-OneMonthDto';
import { CreateCustomDto } from './dto/create-CustonDto';
import { CreateMultiMonthDto } from './dto/create-MultiMontDto';
import { JwtAuthGuard } from 'src/common/guard/jwt-authGuard';
import { RbucGuard } from 'src/common/guard/rbuc.guard';
import { Roles } from 'src/common/decorator/rbuc.decorator';

@Controller('tolovlar')
export class TolovlarController {
  constructor(private readonly tolovlarService: TolovlarService) {}
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Post('one-month')
  oneMonth(@Body() dto: CreateOneMonthDto) {
    return this.tolovlarService.createOneMonth(dto);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Post('custom')
  custom(@Body() dto: CreateCustomDto) {
    return this.tolovlarService.createCustom(dto);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Post('multi-month')
  multiMonth(@Body() dto: CreateMultiMonthDto) {
    return this.tolovlarService.createMultiMonth(dto);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Get()
  async getAll() {
    return this.tolovlarService.findAll();
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.tolovlarService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Get('history')
  getSellerHistory(@Req() req) {
    const sellerId = req.user.userId;
    return this.tolovlarService.getTolovlarHistoryBySeller(sellerId);
  }
}
