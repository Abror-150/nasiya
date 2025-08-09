import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { DebtService } from './debt.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-authGuard';
import { RbucGuard } from 'src/common/guard/rbuc.guard';
import { Roles } from 'src/common/decorator/rbuc.decorator';

@Controller('debt')
export class DebtController {
  constructor(private readonly debtService: DebtService) {}
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Post()
  create(@Body() createDebtDto: CreateDebtDto) {
    return this.debtService.create(createDebtDto);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Get()
  findAll() {
    return this.debtService.findAll();
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Get('monthly-total')
  async getMonthlyTotal(
    @Query('year') yearStr: string,
    @Query('month') monthStr: string,
    @Req() req,
  ) {
    const sellerId = req.user?.userId;
    if (!sellerId) throw new BadRequestException('sellerId topilmadi');

    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month)
      throw new BadRequestException('year va month majburiy');

    return this.debtService.getMonthlyExpectedTotal(sellerId, year, month);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @UseGuards(JwtAuthGuard)
  @Get('byDate')
  async getExpectedPayments(@Req() req, @Query('date') date: string) {
    const sellerId = req.user.userId;
    return this.debtService.getExpectedPaymentsByDate(sellerId, date);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.debtService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDebtDto: UpdateDebtDto) {
    return this.debtService.update(id, updateDebtDto);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.debtService.remove(id);
  }
}
