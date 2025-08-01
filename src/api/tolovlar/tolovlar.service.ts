// tolovlar.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';
import { CreateTolovlarDto } from './dto/create-tolovlar.dto';
import { UpdateTolovlarDto } from './dto/update-tolovlar.dto';

@Injectable()
export class TolovlarService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTolovlarDto) {
    const debt = await this.prisma.debt.findUnique({
      where: { id: dto.debtId },
    });
    if (!debt) throw new NotFoundException('Bunday qarz topilmadi');
    if (dto.amount > debt.amount) {
      throw new BadRequestException('To‘lov summasi qarzdan oshib ketdi');
    }
    const tolov = await this.prisma.tolovlar.create({
      data: {
        amount: dto.amount,
        date: new Date(dto.date),
        method: dto.method,
        duration: dto.duration,
        debtId: dto.debtId,
      },
    });
    await this.prisma.debt.update({
      where: { id: dto.debtId },
      data: {
        amount: debt.amount - dto.amount,
      },
    });

    return tolov;
  }

  async findAll() {
    return this.prisma.tolovlar.findMany({
      include: { debt: true },
    });
  }

  async findOne(id: string) {
    const tolov = await this.prisma.tolovlar.findFirst({
      where: { id },
      include: { debt: true },
    });
    if (!tolov) throw new NotFoundException('To‘lov topilmadi');
    return tolov;
  }

  async update(id: string, dto: UpdateTolovlarDto) {
    const existing = await this.prisma.tolovlar.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('To‘lov topilmadi');

    return this.prisma.tolovlar.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.tolovlar.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('To‘lov topilmadi');
    return this.prisma.tolovlar.delete({ where: { id } });
  }
}
