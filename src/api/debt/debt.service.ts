import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

@Injectable()
export class DebtService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDebtDto) {
    const { name, amount, date, muddat, note, images, phones, mijozId } = data;

    const newDebt = await this.prisma.debt.create({
      data: {
        name,
        amount,
        date: new Date(date),
        muddat,
        note,
        mijozId,
        PhoneDebt: { create: phones?.map((p) => ({ phoneNumber: p })) || [] },
        ImagesDebt: { create: images?.map((img) => ({ url: img })) || [] },
      },
      include: { PhoneDebt: true, ImagesDebt: true },
    });

    const muddatOy = parseInt(String(muddat).replace(/\D/g, ''), 10) || 0;
    const monthlyAmount = muddatOy > 0 ? Math.floor(amount / muddatOy) : amount;
    const startDate = new Date(date);

    for (let i = 1; i <= muddatOy; i++) {
      const payDate = new Date(startDate);
      payDate.setMonth(payDate.getMonth() + (i - 1));

      await this.prisma.tolovOy.create({
        data: {
          month: i,
          status: 'PENDING',
          partialAmount: 0,
          tolov: {
            create: {
              amount: monthlyAmount,
              date: payDate,
              method: 'MULTI_MONTH',
              debtId: newDebt.id,
            },
          },
        },
      });
    }

    return newDebt;
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
  private formatYMD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async getMonthlyExpectedTotal(sellerId: string, year: number, month: number) {
    const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

    const rows = await this.prisma.tolovOy.findMany({
      where: {
        status: { in: ['UNPAID', 'PENDING'] as any },
        tolov: {
          date: { gte: from, lt: to },
          debt: { mijoz: { sellerId } },
        },
      },
      select: {
        partialAmount: true,
        tolov: {
          select: {
            amount: true,
            debt: {
              select: {
                amount: true,
                muddat: true,
              },
            },
          },
        },
      },
    });

    const total = rows.reduce((acc, r) => {
      const debt = r.tolov.debt;
      const muddatOy =
        parseInt(String(debt.muddat ?? '').replace(/\D/g, ''), 10) || 0;
      const monthlyByDebt =
        muddatOy > 0 ? Math.floor((debt.amount ?? 0) / muddatOy) : 0;
      const monthly = r.tolov.amount ?? monthlyByDebt;

      const paidPart = r.partialAmount ?? 0;
      const remaining = Math.max(monthly - paidPart, 0);
      return acc + remaining;
    }, 0);

    return { year, month, total };
  }

  async getExpectedPaymentsByDate(sellerId: string, dateStr: string) {
    if (!sellerId) throw new BadRequestException('sellerId topilmadi');
    if (!dateStr) throw new BadRequestException('date kerak (YYYY-MM-DD)');

    const from = new Date(`${dateStr}T00:00:00.000Z`);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 1);

    const rows = await this.prisma.tolovOy.findMany({
      where: {
        status: { in: ['UNPAID', 'PENDING'] as any },
        tolov: {
          date: { gte: from, lt: to },
          debt: { mijoz: { sellerId } },
        },
      },
      select: {
        partialAmount: true,
        tolov: {
          select: {
            amount: true,
            date: true,
            debt: {
              select: {
                amount: true,
                muddat: true,
                mijoz: {
                  select: {
                    name: true,
                    PhoneClient: { select: { phoneNumber: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { tolov: { date: 'asc' } },
    });

    return rows.map((r) => {
      const debt = r.tolov.debt;

      const muddatOy =
        parseInt(String(debt.muddat ?? '').replace(/\D/g, ''), 10) || 0;
      const monthlyByDebt =
        muddatOy > 0 ? Math.floor((debt.amount ?? 0) / muddatOy) : 0;
      const monthly = r.tolov.amount ?? monthlyByDebt;

      const paidPart = r.partialAmount ?? 0;
      const remaining = Math.max(monthly - paidPart, 0);

      return {
        name: debt.mijoz.name,
        phone: debt.mijoz.PhoneClient?.[0]?.phoneNumber ?? '',
        payDate: this.formatYMD(r.tolov.date),
        remaining,
      };
    });
  }
  async getMonthlyDaysWithPayments(
    sellerId: string,
    year: number,
    month: number,
  ) {
    const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

    const rows = await this.prisma.tolovOy.findMany({
      where: {
        status: { in: ['UNPAID', 'PENDING'] as any },
        tolov: {
          date: { gte: from, lt: to },
          debt: { mijoz: { sellerId } },
        },
      },
      select: {
        tolov: { select: { date: true } },
      },
    });

    const daySet = new Set<number>();
    for (const r of rows) {
      const d = new Date(r.tolov.date).getUTCDate();
      daySet.add(d);
    }

    const days = Array.from(daySet).sort((a, b) => a - b);
    return { days };
  }
}
