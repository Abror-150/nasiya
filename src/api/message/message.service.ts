import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMessageDto) {
    return this.prisma.message.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.message.findMany({
      orderBy: { creadetAt: 'desc' },
      include: {
        mijoz: {
          select: { name: true, PhoneClient: true },
        },
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
