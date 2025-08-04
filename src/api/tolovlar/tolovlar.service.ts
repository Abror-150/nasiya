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

    const existing = await this.prisma.tolovOy.findFirst({
      where: {
        tolov: { debtId: dto.debtId },
        month,
      },
    });

    const paidSoFar =
      existing?.status === statusType.UNPAID
        ? monthlyAmount - (existing?.partialAmount ?? monthlyAmount)
        : 0;

    const remaining = monthlyAmount - paidSoFar;

    const payment = await this.savePayment(dto, remaining);

    if (existing) {
      await this.prisma.tolovOy.update({
        where: { id: existing.id },
        data: {
          partialAmount: 0,
          status: statusType.PAID,
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

      const paidSoFar = existing?.partialAmount ?? 0;
      const remaining = monthlyAmount - paidSoFar;

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
        const newPaid = paidSoFar + amountLeft;
        const stillRemaining = monthlyAmount - newPaid;
        const status =
          stillRemaining <= 0 ? statusType.PAID : statusType.UNPAID;

        if (existing) {
          await this.prisma.tolovOy.update({
            where: { id: existing.id },
            data: {
              partialAmount: stillRemaining <= 0 ? 0 : stillRemaining,
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
              partialAmount: stillRemaining <= 0 ? 0 : stillRemaining,
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

    if (!dto.months || dto.months.length === 0) {
      throw new BadRequestException(
        'Oylar ro‘yxati bo‘sh bo‘lishi mumkin emas',
      );
    }

    const totalMonths = this.parseMuddat(debt.muddat);
    const monthlyAmount = Math.floor(debt.amount / totalMonths);

    const sortedMonths = [...dto.months].sort((a, b) => a - b);
    for (let i = 1; i < sortedMonths.length; i++) {
      if (sortedMonths[i] !== sortedMonths[i - 1] + 1) {
        throw new BadRequestException(
          'Oylar ketma-ket tanlanishi kerak (masalan: 4,5,6)',
        );
      }
    }
    const invalidMonth = sortedMonths.find((m) => m > totalMonths);
    if (invalidMonth) {
      throw new BadRequestException(
        `Siz faqat ${totalMonths} oyga qarz olgansiz. ${invalidMonth}-oy mavjud emas.`,
      );
    }

    const unpaidMonths = await this.getUnpaidMonths(dto.debtId);
    const expectedFirstMonth = unpaidMonths[0];
    if (sortedMonths[0] !== expectedFirstMonth) {
      throw new BadRequestException(
        `To‘lov ${expectedFirstMonth}-oydan boshlanishi kerak.`,
      );
    }

    let totalAmount = 0;
    const updates: {
      existing?: string;
      data: {
        month: number;
        partialAmount: number;
        status: statusType;
      };
    }[] = [];

    for (const month of sortedMonths) {
      const existing = await this.prisma.tolovOy.findFirst({
        where: {
          tolov: { debtId: dto.debtId },
          month,
        },
      });

      const paidSoFar = existing
        ? existing.status === statusType.UNPAID
          ? monthlyAmount - (existing.partialAmount ?? monthlyAmount)
          : 0
        : 0;

      const remaining = monthlyAmount - paidSoFar;

      totalAmount += remaining;

      updates.push({
        existing: existing?.id,
        data: {
          month,
          partialAmount: 0,
          status: statusType.PAID,
        },
      });
    }

    const remainingDebt = debt.amount - debt.paidAmount;
    if (totalAmount > remainingDebt) {
      throw new BadRequestException(
        'Tanlangan oylar uchun to‘lov qarzdan oshib ketdi',
      );
    }

    const payment = await this.savePayment(dto, totalAmount);

    for (const item of updates) {
      if (item.existing) {
        await this.prisma.tolovOy.update({
          where: { id: item.existing },
          data: {
            ...item.data,
            tolovId: payment.id,
          },
        });
      } else {
        await this.prisma.tolovOy.create({
          data: {
            ...item.data,
            tolovId: payment.id,
          },
        });
      }
    }

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
  async getLatePaymentsSummary() {
    const today = new Date();

    const overduePayments = await this.prisma.tolovOy.findMany({
      where: {
        status: 'UNPAID',
        tolov: {
          date: {
            lt: today,
          },
        },
      },
      select: {
        tolov: {
          select: {
            debt: {
              select: {
                mijozId: true,
              },
            },
          },
        },
      },
    });

    const latePaymentsCount = overduePayments.length;

    const uniqueClients = new Set<string>();
    for (const item of overduePayments) {
      const mijozId = item?.tolov?.debt?.mijozId;
      if (mijozId) {
        uniqueClients.add(mijozId);
      }
    }

    const lateClientsCount = uniqueClients.size;

    return {
      kechiktirilganTolovlar: latePaymentsCount,
      kechiktirganMijozlar: lateClientsCount,
    };
  }
}
