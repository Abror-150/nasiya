import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

@Injectable()
export class DebtService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDebtDto) {
    const { name, amount, date, muddat, note, images, phones, mijozId } = data;

    return await this.prisma.debt.create({
      data: {
        name,
        amount,
        date: new Date(date),
        muddat,
        note,
        mijozId,
        PhoneDebt: {
          create: phones?.map((p) => ({ phoneNumber: p})) || [],
        },
        ImagesDebt: {
          create: images?.map((img) => ({ url: img })) || [],
        },
      },
      include: { PhoneDebt: true, ImagesDebt: true },
    });
  }

  async findAll() {
    return await this.prisma.debt.findMany({
      include: {
        ImagesDebt: true,
        mijoz: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const debt = await this.prisma.debt.findFirst({
      where: { id },
      include: { mijoz: true, Tolovlar: true },
    });

    if (!debt) throw new NotFoundException('Qarz topilmadi');

    return debt;
  }

  async update(id: string, data: UpdateDebtDto) {
    const existing = await this.prisma.debt.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Qarz mavjud emas');

    const updatedDebt = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.debt.update({
        where: { id },
        data: {
          name: data.name,
          amount: data.amount,
          date: data.date,
          muddat: data.muddat,
          note: data.note,
        },
      });

      await tx.imagesDebt.deleteMany({ where: { debtId: id } });

      if (data.images?.length) {
        await tx.imagesDebt.createMany({
          data: data.images.map((img) => ({
            url: img,
            debtId: id,
          })),
        });
      }

      await tx.phoneDebt.deleteMany({ where: { debtId: id } });

      if (data.phones?.length) {
        await tx.phoneDebt.createMany({
          data: data.phones.map((p) => ({
            phoneNumber: p,
            debtId: id,
          })),
        });
      }

      return updated;
    });

    return updatedDebt;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.debt.delete({ where: { id } });
    return { message: 'Qarz o‘chirildi' };
  }
}
