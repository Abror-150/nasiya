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

  async  getTotalNasiyaFromSchedules(sellerId?: string) {
    const statuses = (['UNPAID', 'PENDING'] as unknown) as any;
  
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
  
    const results: Record<string, { name: string; phone: string; total: number }> = {};
  
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
