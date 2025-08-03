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
    const monthlyAmount = Math.floor(debt.amount / totalMonths);

    const unpaidMonths = await this.getUnpaidMonths(dto.debtId);
    const month = unpaidMonths[0];
    if (!month) throw new BadRequestException('Barcha oylar to‘langan');

    const payment = await this.savePayment(dto, monthlyAmount);
    await this.prisma.tolovOy.create({
      data: { tolovId: payment.id, month, status: statusType.PAID },
    });

    return payment;
  }
  private parseMuddat(muddat: string): number {
    const match = muddat.match(/(\d+)\s*oy/i);
    if (!match) throw new BadRequestException('Muddat noto‘g‘ri formatda');
    return parseInt(match[1]);
  }

  async createCustom(dto: CreateCustomDto) {
    const debt = await this.getDebt(dto.debtId);

    if (!dto.amount || dto.amount < 1) {
      throw new BadRequestException('To‘lov summasi noto‘g‘ri');
    }

    const remainingDebt = debt.amount - debt.paidAmount;
    if (dto.amount > remainingDebt) {
      throw new BadRequestException(
        'To‘lov summasi qolgan qarzdan oshib ketdi',
      );
    }

    const totalMonths = this.parseMuddat(debt.muddat);
    const monthlyAmount = Math.floor(debt.amount / totalMonths);

    let amountLeft = dto.amount;
    const unpaidMonths = await this.getUnpaidMonths(dto.debtId);
    if (unpaidMonths.length === 0) {
      throw new BadRequestException('Barcha oylar to‘langan');
    }

    const payment = await this.savePayment(dto, dto.amount);

    for (const month of unpaidMonths) {
      if (amountLeft <= 0) break;

      const existing = await this.prisma.tolovOy.findFirst({
        where: {
          tolov: { debtId: dto.debtId },
          month,
        },
      });

      const remaining = existing?.partialAmount ?? monthlyAmount;

      if (amountLeft >= remaining) {
        if (existing) {
          await this.prisma.tolovOy.update({
            where: { id: existing.id },
            data: {
              status: statusType.PAID,
              partialAmount: 0,
              tolovId: payment.id,
            },
          });
        } else {
          await this.prisma.tolovOy.create({
            data: {
              tolovId: payment.id,
              month,
              status: statusType.PAID,
              partialAmount: 0,
            },
          });
        }
        amountLeft -= remaining;
      } else {
        const newRemaining = remaining - amountLeft;
        const status = newRemaining <= 0 ? statusType.PAID : statusType.UNPAID;

        if (existing) {
          await this.prisma.tolovOy.update({
            where: { id: existing.id },
            data: {
              partialAmount: newRemaining,
              status,
              tolovId: payment.id,
            },
          });
        } else {
          await this.prisma.tolovOy.create({
            data: {
              tolovId: payment.id,
              month,
              status,
              partialAmount: newRemaining,
            },
          });
        }

        amountLeft = 0;
      }
    }

    return payment;
  }

  async createMultiMonth(dto: CreateMultiMonthDto) {
    const debt = await this.getDebt(dto.debtId);
    if (!dto.months || dto.months.length === 0)
      throw new BadRequestException(
        'Oylar ro‘yxati bo‘sh bo‘lishi mumkin emas',
      );
    const totalMonths = this.parseMuddat(debt.muddat);
    const monthlyAmount = Math.floor(debt.amount / totalMonths);

    const paidMonths = await this.prisma.tolovOy.findMany({
      where: { tolov: { debtId: dto.debtId }, status: statusType.PAID },
      select: { month: true },
    });
    const paidMonthNumbers = paidMonths.map((m) => m.month);

    const filteredMonths = dto.months.filter(
      (m) => !paidMonthNumbers.includes(m),
    );
    if (filteredMonths.length === 0)
      throw new BadRequestException('Tanlangan oylar allaqachon to‘langan');
    const sortedMonths = [...filteredMonths].sort((a, b) => a - b);
    for (let i = 1; i < sortedMonths.length; i++) {
      if (sortedMonths[i] !== sortedMonths[i - 1] + 1) {
        throw new BadRequestException(
          'Oylar ketma-ket tanlanishi kerak (masalan: 4,5,6).',
        );
      }
    }

    const unpaidMonths = await this.getUnpaidMonths(dto.debtId);
    const expectedFirstMonth = unpaidMonths[0];
    if (sortedMonths[0] !== expectedFirstMonth) {
      throw new BadRequestException(
        `To‘lov ${expectedFirstMonth}-oydan boshlanishi kerak.`,
      );
    }

    const amount = monthlyAmount * sortedMonths.length;

    if (amount > debt.amount - debt.paidAmount)
      throw new BadRequestException(
        'Tanlangan oylar uchun to‘lov qarzdan oshib ketdi',
      );

    const payment = await this.savePayment(dto, amount);

    await this.prisma.tolovOy.createMany({
      data: sortedMonths.map((month) => ({
        tolovId: payment.id,
        month,
        status: statusType.PAID,
      })),
    });

    return payment;
  }

  private async getUnpaidMonths(debtId: string): Promise<number[]> {
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    const paidMonths = await this.prisma.tolovOy.findMany({
      where: { tolov: { debtId }, status: statusType.PAID },
      select: { month: true },
    });
    const paidMonthNumbers = paidMonths.map((m) => m.month);
    return allMonths.filter((m) => !paidMonthNumbers.includes(m));
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
}
