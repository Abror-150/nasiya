import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-authGuard';
import { RbucGuard } from 'src/common/guard/rbuc.guard';
import { Roles } from 'src/common/decorator/rbuc.decorator';
import { ApiQuery } from '@nestjs/swagger';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
  @UseGuards(JwtAuthGuard, RbucGuard)
  @Roles('admin', 'seller')
  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.create(createMessageDto);
  }
  @Post('createChat')
  async getOrCreate(@Body('mijozId') mijozId: string) {
    return this.messageService.getOrCreateChat(mijozId);
  }
  @Get('without-messages')
  async findClientsWithoutMessages() {
    return this.messageService.findClientsWithoutMessages();
  }
  @Roles('admin', 'seller')
  @ApiQuery({
    name: 'chatId',
    required: false,
    type: String,
  })
  @Get()
  findAll(@Query('chatId') chatId: string) {
    return this.messageService.findAll(chatId);
  }

  @Get('chats')
  allChats() {
    return this.messageService.allChatMessages();
  }
  @Roles('admin', 'seller')
  @Delete(':chatId')
  deleteChats(@Param('chatId') chatId: string) {
    return this.messageService.deleteChat(chatId);
  }

  @Roles('admin', 'seller')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messageService.update(id, updateMessageDto);
  }
  @Roles('admin', 'seller')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messageService.remove(id);
  }

  @Roles('admin', 'seller')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messageService.findOne(id);
  }
}
