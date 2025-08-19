import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { SellerService } from './seller.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { RbucGuard } from 'src/common/guard/rbuc.guard';
import { JwtAuthGuard } from 'src/common/guard/jwt-authGuard';
import { Roles } from 'src/common/decorator/rbuc.decorator';
import { ApiBody } from '@nestjs/swagger';

@Controller('seller')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}
  // @UseGuards(JwtAuthGuard, RbucGuard)
  // @Roles('admin')
  @Post()
  create(@Body() createSellerDto: CreateSellerDto) {
    return this.sellerService.Register(createSellerDto);
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMySellerInfo(@Req() req) {
    const sellerId = req.user.userId;
    return this.sellerService.me(sellerId);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.sellerService.findAll();
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sellerService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('admin', "seller")
  @Patch(':id')
  @ApiBody({ type: UpdateSellerDto })
  update(@Param('id') id: string, @Body() updateSellerDto: UpdateSellerDto) {
    return this.sellerService.update(id, updateSellerDto);
  }
  @Patch(':id/image')
async updateImage(
  @Param('id') id: string,
  @Body('img') img: string,
) {
  if (!img) {
    throw new BadRequestException('Rasm URL kiritilmadi');
  }

  return this.sellerService.updateImage(id, img);
}

  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sellerService.remove(id);
  }
}
