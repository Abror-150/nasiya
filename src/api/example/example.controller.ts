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
import { ExampleService } from './example.service';
import { CreateExampleDto } from './dto/create-example.dto';
import { UpdateExampleDto } from './dto/update-example.dto';
import { Roles } from 'src/common/decorator/rbuc.decorator';
import { JwtAuthGuard } from 'src/common/guard/jwt-authGuard';
import { RbucGuard } from 'src/common/guard/rbuc.guard';

@Controller('example')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('seller')
  @Post()
  create(@Body() createExampleDto: CreateExampleDto, @Req() req) {
    const sellerId = req.user.userId;
    return this.exampleService.create(createExampleDto, sellerId);
  }

  @Get()
  findAll() {
    return this.exampleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exampleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExampleDto: UpdateExampleDto) {
    return this.exampleService.update(id, updateExampleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exampleService.remove(id);
  }
}
