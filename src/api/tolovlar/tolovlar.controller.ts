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
  BadRequestException,
  Query,
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
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Get()
  async getAll() {
    return this.tolovlarService.findAll();
  }
  @Get('monthly-total')
  @UseGuards(JwtAuthGuard)
  async getMonthlyTotal(
    @Query('year') year: string,
    @Query('month') month: string,
    @Req() req,
  ) {
    const sellerId = req.user.userId;

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    return this.tolovlarService.getMonthlyTotal(sellerId, yearNum, monthNum);
  }
  @Get('by-date')
  @UseGuards(JwtAuthGuard)
  async getByDate(@Query('date') date: string, @Req() req) {
    const sellerId = req.user.userId;

    return this.tolovlarService.getPaymentsByDate(sellerId, date);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.tolovlarService.findOne(id);
  }
}
