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
  Query,
} from '@nestjs/common';
import { TolovlarService } from './tolovlar.service';
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
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Req() req) {
    const sellerId = req.user.userId;
    return this.tolovlarService.getDashboardStats(sellerId);
  }

  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Get('history')
  getSellerHistory(@Req() req) {
    const sellerId = req.user.userId;
    console.log(sellerId);

    return this.tolovlarService.getTolovlarHistoryBySeller(sellerId);
  }
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getTotalNasiya(@Req() req) {
    const sellerId = req.user.userId;

    return this.tolovlarService.getTotalNasiyaFromSchedules(sellerId);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Get()
  async getAll() {
    return this.tolovlarService.findAll();
  }
  // @UseGuards(JwtAuthGuard)
  // @Get('unpaid-monthly-total')
  // async getUnpaidMonthlyTotal(@Query('date') date: string, @Req() req) {
  //   const user: any = req.user.userId;
  //   const sellerId = user.id;

  //   return this.tolovlarService.getExpectedMonthlyUnpaidTotal(sellerId, date);
  // }

  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.tolovlarService.findOne(id);
  }
}
