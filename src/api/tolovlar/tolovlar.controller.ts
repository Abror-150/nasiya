import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TolovlarService } from './tolovlar.service';
import { CreateTolovlarDto } from './dto/create-tolovlar.dto';
import { UpdateTolovlarDto } from './dto/update-tolovlar.dto';

@Controller('tolovlar')
export class TolovlarController {
  constructor(private readonly tolovlarService: TolovlarService) {}

  @Post()
  create(@Body() createTolovlarDto: CreateTolovlarDto) {
    return this.tolovlarService.create(createTolovlarDto);
  }

  @Get()
  findAll() {
    return this.tolovlarService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tolovlarService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTolovlarDto: UpdateTolovlarDto,
  ) {
    return this.tolovlarService.update(id, updateTolovlarDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tolovlarService.remove(id);
  }
}
