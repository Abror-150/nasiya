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
import { MijozService } from './mijoz.service';
import { CreateMijozDto } from './dto/create-mijoz.dto';
import { UpdateMijozDto } from './dto/update-mijoz.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-authGuard';
import { RbucGuard } from 'src/common/guard/rbuc.guard';
import { Roles } from 'src/common/decorator/rbuc.decorator';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('mijoz')
export class MijozController {
  constructor(private readonly mijozService: MijozService) {}
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller', 'admin')
  @Post()
  create(@Body() createMijozDto: CreateMijozDto, @Req() req) {
    const sellerId = req.user.userId;

    return this.mijozService.create(createMijozDto, sellerId);
  }
  @Get()
  @ApiOperation({
    summary: 'Mijozlar ro‘yxatini olish (pagination va filter bilan)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.mijozService.findAll({ page, limit, search });
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mijozService.findOne(id);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMijozDto: UpdateMijozDto) {
    return this.mijozService.update(id, updateMijozDto);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mijozService.remove(id);
  }
}
