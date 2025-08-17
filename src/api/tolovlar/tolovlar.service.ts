import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';
import { CreateTolovlarDto } from './dto/createTolovDto';
import { statusType } from '@prisma/client';
import { CreateOneMonthDto } from './dto/create-OneMonthDto';
import { CreateCustomDto } from './dto/create-CustonDto';
import { CreateMultiMonthDto } from './dto/create-MultiMontDto';

@Injectable()
export class TolovlarService {
  constructor(private readonly prisma: PrismaService) {}

  async createOneMonth(dto: CreateOneMonthDto) {
    const debt = await this.getDebt(dto.debtId);
    const totalMonths = this.parseMuddat(debt.muddat);
    const monthlyAmount = this.getMonthlyAmount(debt.amount, totalMonths);

    const unpaid = await this.getUnpaidMonths(dto.debtId);
    const month = unpaid[0];
    if (!month) throw new BadRequestException('Barcha oylar to‘langan');

    const existing = await this.prisma.tolovOy.findFirst({
      where: { tolov: { debtId: dto.debtId }, month },
      select: { id: true, partialAmount: true },
    });

    const paidSoFar = Number(existing?.partialAmount ?? 0);
    const remaining = Math.max(monthlyAmount - paidSoFar, 0);
    if (remaining <= 0) {
      throw new BadRequestException(`${month}-oy allaqachon to‘langan`);
    }

    const payment = await this.savePayment(dto, remaining);

    await this.upsertTolovOyByMonth(dto.debtId, month, {
      tolovId: payment.id,
      status: 'PAID',
      partialAmount: monthlyAmount,
    });

    return payment;
  }

  private parseMuddat(muddat: string): number {
    const m = muddat.match(/(\d+)\s*oy/i);
    if (!m) throw new BadRequestException('Muddat noto‘g‘ri formatda');
    return parseInt(m[1], 10);
  }

  async createCustom(dto: CreateCustomDto) {
    const debt = await this.getDebt(dto.debtId);
    if (!dto.amount || dto.amount < 1) {
      throw new BadRequestException('To‘lov summasi noto‘g‘ri');
    }

    const totalMonths = this.parseMuddat(debt.muddat);
    const monthlyAmount = this.getMonthlyAmount(debt.amount, totalMonths);

    let amountLeft = dto.amount;

    const remainingDebt = debt.amount - debt.paidAmount;
    if (dto.amount > remainingDebt) {
      throw new BadRequestException(
        `Sizning umumiy qarzingiz ${remainingDebt} so‘m, shundan ortig‘ini to‘lay olmaysiz`,
      );
    }

    const unpaid = await this.getUnpaidMonths(dto.debtId);
    if (unpaid.length === 0) {
      throw new BadRequestException('Barcha oylar to‘langan');
    }

    const payment = await this.savePayment(dto, dto.amount);

    for (const month of unpaid) {
      if (amountLeft <= 0) break;

      const existing = await this.prisma.tolovOy.findFirst({
        where: { tolov: { debtId: dto.debtId }, month },
        select: { id: true, partialAmount: true, status: true },
      });

      const paidSoFar = Number(existing?.partialAmount ?? 0);
      const remain = Math.max(monthlyAmount - paidSoFar, 0);
      if (remain <= 0) continue;

      const payThis = Math.min(remain, amountLeft);
      const newPartial = paidSoFar + payThis;
      const newStatus: statusType =
        newPartial >= monthlyAmount ? 'PAID' : (existing?.status ?? 'UNPAID');

      await this.upsertTolovOyByMonth(dto.debtId, month, {
        tolovId: payment.id,
        status: newStatus,
        partialAmount: newPartial,
      });

      amountLeft -= payThis;
    }

    return payment;
  }

  private async upsertTolovOyByMonth(
    debtId: string,
    month: number,
    data: { status: statusType; partialAmount: number; tolovId: string },
  ) {
    const existing = await this.prisma.tolovOy.findFirst({
      where: { tolov: { debtId }, month },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.tolovOy.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await this.prisma.tolovOy.create({
        data: { month, ...data },
      });
    }
  }
  private getMonthlyAmount(debtAmount: number, totalMonths: number) {
    return Math.floor(debtAmount / totalMonths);
  }

  async createMultiMonth(dto: CreateMultiMonthDto) {
    const debt = await this.getDebt(dto.debtId);
    if (!dto.months || dto.months.length === 0) {
      throw new BadRequestException(
        'Oylar ro‘yxati bo‘sh bo‘lishi mumkin emas',
      );
    }

    const totalMonths = this.parseMuddat(debt.muddat);
    const monthlyAmount = this.getMonthlyAmount(debt.amount, totalMonths);

    const months = [...dto.months].sort((a, b) => a - b);
    for (let i = 1; i < months.length; i++) {
      if (months[i] !== months[i - 1] + 1) {
        throw new BadRequestException(
          'Oylar ketma-ket tanlanishi kerak (masalan: 2,3,4)',
        );
      }
    }

    const unpaid = await this.getUnpaidMonths(dto.debtId);
    const expectedFirst = unpaid[0];
    if (months[0] !== expectedFirst) {
      throw new BadRequestException(
        `To‘lov ${expectedFirst}-oydan boshlanishi kerak`,
      );
    }

    let totalAmount = 0;
    const perMonthRemain: Record<number, number> = {};

    for (const m of months) {
      const ex = await this.prisma.tolovOy.findFirst({
        where: { tolov: { debtId: dto.debtId }, month: m },
        select: { partialAmount: true },
      });
      const paidSoFar = Number(ex?.partialAmount ?? 0);
      const remain = Math.max(monthlyAmount - paidSoFar, 0);
      perMonthRemain[m] = remain;
      totalAmount += remain;
    }

    const remainingDebt = debt.amount - debt.paidAmount;
    if (totalAmount > remainingDebt) {
      throw new BadRequestException(
        'Tanlangan oylar uchun to‘lov qarzdan oshib ketdi',
      );
    }

    const payment = await this.savePayment(dto, totalAmount);

    for (const m of months) {
      const ex = await this.prisma.tolovOy.findFirst({
        where: { tolov: { debtId: dto.debtId }, month: m },
        select: { partialAmount: true },
      });

      const paidSoFar = Number(ex?.partialAmount ?? 0) + perMonthRemain[m];
      const status = paidSoFar >= monthlyAmount ? 'PAID' : 'PENDING';

      await this.upsertTolovOyByMonth(dto.debtId, m, {
        tolovId: payment.id,
        status,
        partialAmount: paidSoFar,
      });
    }

    return payment;
  }

  private async getUnpaidMonths(debtId: string): Promise<number[]> {
    const debt = await this.getDebt(debtId);
    const totalMonths = this.parseMuddat(debt.muddat);
    const monthlyAmount = this.getMonthlyAmount(debt.amount, totalMonths);

    const rows = await this.prisma.tolovOy.findMany({
      where: { tolov: { debtId } },
      select: { month: true, status: true, partialAmount: true },
    });

    const map = new Map<number, { status: statusType; partial: number }>();
    for (const r of rows) {
      map.set(r.month, {
        status: r.status,
        partial: Number(r.partialAmount ?? 0),
      });
    }

    const list: number[] = [];
    for (let m = 1; m <= totalMonths; m++) {
      const rec = map.get(m);
      const paidSoFar = rec ? rec.partial : 0;
      const fullyPaid = paidSoFar >= monthlyAmount || rec?.status === 'PAID';
      if (!fullyPaid) list.push(m);
    }
    return list;
  }

  private async savePayment(dto: CreateTolovlarDto, amount: number) {
    const debt = await this.getDebt(dto.debtId);

    const payment = await this.prisma.tolovlar.create({
      data: {
        amount,
        date: new Date(dto.date),
        method: dto.method,
        duration: dto.duration,
        debtId: dto.debtId,
      },
    });

    await this.prisma.debt.update({
      where: { id: dto.debtId },
      data: { paidAmount: debt.paidAmount + amount },
    });

    return payment;
  }

  private async getDebt(debtId: string) {
    const debt = await this.prisma.debt.findUnique({ where: { id: debtId } });
    if (!debt) throw new NotFoundException('Bunday qarz topilmadi');
    return debt;
  }

  async findAll() {
    const tolovlar = await this.prisma.tolovlar.findMany({
      orderBy: { date: 'desc' },
      include: {
        TolovOy: {
          select: {
            month: true,
            status: true,
            partialAmount: true,
          },
        },
      },
    });

    return tolovlar;
  }

  async findOne(id: string) {
    const tolov = await this.prisma.tolovlar.findUnique({
      where: { id },
      include: {
        TolovOy: {
          select: {
            month: true,
            status: true,
            partialAmount: true,
          },
        },
      },
    });

    if (!tolov) {
      throw new NotFoundException('To‘lov topilmadi');
    }

    return tolov;
  }
  async getTolovlarHistoryBySeller(sellerId: string) {
    const payments = await this.prisma.tolovlar.findMany({
      where: {
        debt: {
          mijoz: {
            sellerId,
          },
        },
      },
      include: {
        debt: {
          include: {
            mijoz: {
              include: {
                PhoneClient: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const grouped = payments.reduce(
      (acc, payment) => {
        const dateKey = payment.date.toISOString().split('T')[0];

        if (!acc[dateKey]) acc[dateKey] = [];

        const mijoz = payment.debt.mijoz;
        const phone = mijoz.PhoneClient?.[0]?.phoneNumber ?? 'Noma’lum';

        acc[dateKey].push({
          name: mijoz.name,
          phone: phone,
          amount: -payment.amount,
        });

        return acc;
      },
      {} as Record<string, any[]>,
    );

    return Object.entries(grouped).map(([date, payments]) => ({
      date,
      payments,
    }));
  }

  async getDashboardStats(sellerId: string) {
    const today = new Date();

    const totalDebt = await this.prisma.debt.aggregate({
      where: {
        mijoz: {
          sellerId,
        },
      },
      _sum: {
        amount: true,
        paidAmount: true,
      },
    });

    const latePayments = await this.prisma.tolovOy.count({
      where: {
        status: 'UNPAID',
        tolov: {
          date: { lt: today },
          debt: {
            mijoz: {
              sellerId,
            },
          },
        },
      },
    });

    const clients = await this.prisma.mijoz.findMany({
      where: { sellerId },
      select: { id: true },
    });

    const clientCount = clients.length;

    const amount = totalDebt._sum.amount ?? 0;
    const paid = totalDebt._sum.paidAmount ?? 0;

    return {
      totalDebt: amount,
      totalPaid: paid,
      totalRemaining: amount - paid,
      latePayments,
      clientCount,
    };
  }

  // async getExpectedMonthlyUnpaidTotal(sellerId: string, date: string) {
  //   const targetDate = new Date(date);
  //   const year = targetDate.getFullYear();
  //   const month = targetDate.getMonth() + 1;

  //   const fromDate = new Date(`${year}-${month.toString().padStart(2, '0')}-01`);
  //   const toDate = new Date(fromDate);
  //   toDate.setMonth(toDate.getMonth() + 1);

  //   // Faqat UNPAID bo'lgan oylar uchun hisoblash
  //   const unpaid = await this.prisma.tolovOy.findMany({
  //     where: {
  //       status: 'UNPAID',
  //       tolov: {
  //         date: {
  //           gte: fromDate,
  //           lt: toDate,
  //         },
  //         debt: {
  //           mijoz: {
  //             sellerId,
  //           },
  //         },
  //       },
  //     },
  //     select: {
  //       partialAmount: true,
  //       tolov: {
  //         select: {
  //           amount: true,
  //         },
  //       },
  //     },
  //   });

  //   const totalUnpaid = unpaid.reduce((acc, item) => {
  //     const remaining =
  //       item.tolov.amount - (item.partialAmount ?? 0);
  //     return acc + remaining;
  //   }, 0);

  //   return {
  //     year,
  //     month,
  //     unpaidTotal: totalUnpaid,
  //   };
  // }

  async getTotalNasiyaFromSchedules(sellerId?: string) {
    const statuses = ['UNPAID', 'PENDING'] as unknown as any;

    const items = await this.prisma.tolovOy.findMany({
      where: {
        status: { in: statuses },
        tolov: {
          debt: {
            mijoz: sellerId ? { sellerId } : {},
          },
        },
      },
      select: {
        partialAmount: true,
        tolov: {
          select: {
            amount: true,
            debt: {
              select: {
                mijoz: {
                  select: {
                    id: true,
                    name: true,
                    PhoneClient: { select: { phoneNumber: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!items.length) {
      return { list: [], grandTotal: 0 };
    }

    const results: Record<
      string,
      { name: string; phone: string; total: number }
    > = {};

    for (const it of items) {
      const monthly = it.tolov.amount;
      const remaining = Math.max(monthly - (it.partialAmount ?? 0), 0);

      const mijozId = it.tolov.debt.mijoz.id;
      const name = it.tolov.debt.mijoz.name;
      const phone = it.tolov.debt.mijoz.PhoneClient?.[0]?.phoneNumber || '';

      if (!results[mijozId]) {
        results[mijozId] = { name, phone, total: 0 };
      }
      results[mijozId].total += remaining;
    }

    const list = Object.entries(results).map(([mijozId, data]) => ({
      mijozId,
      name: data.name,
      phone: data.phone,
      total: data.total,
    }));

    list.sort((a, b) => b.total - a.total);

    const grandTotal = list.reduce((s, x) => s + x.total, 0);

    return { list, grandTotal };
  }
}
