import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMessageDto) {
    return this.prisma.message.create({
      data: {
        ...data,
        text: data.text ?? '',
        chatId: data.chatId,
      },
    });
  }
  async getOrCreateChat(mijozId: string) {
    let chat = await this.prisma.chat.findFirst({
      where: { mijozId },
      include: { messages: true },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: { mijozId },
        include: {
          messages: true,
          mijoz: { select: { name: true, PhoneClient: true } },
        },
      });
    }

    return chat;
  }

  async findAll(chatId: string) {
    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { creadetAt: 'desc' },
      include: {
        mijoz: {
          select: { name: true, PhoneClient: true },
        },
      },
    });
  }
  async findClientsWithoutMessages() {
    return this.prisma.mijoz.findMany({
      where: {
        Message: {
          none: {},
        },
      },
      select: {
        id: true,
        name: true,
        PhoneClient: true,
      },
    });
  }

  async findOne(id: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        mijoz: {
          select: { name: true, PhoneClient: true },
        },
      },
    });
    if (!message) throw new NotFoundException('Xabar topilmadi');
    return message;
  }

  async update(id: string, data: UpdateMessageDto) {
    await this.findOne(id);
    return this.prisma.message.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.message.delete({
      where: { id },
    });
  }

  async findByMijoz(mijozId: string) {
    return this.prisma.message.findMany({
      where: { mijozId },
      orderBy: { creadetAt: 'asc' },
      include: {
        mijoz: {
          select: { name: true, PhoneClient: true },
        },
      },
    });
  }
}
