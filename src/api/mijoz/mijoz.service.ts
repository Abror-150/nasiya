import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMijozDto } from './dto/create-mijoz.dto';
import { UpdateMijozDto } from './dto/update-mijoz.dto';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { TolovlarService } from '../tolovlar/tolovlar.service';
import { addMonths } from 'date-fns';
@Injectable()
export class MijozService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tolovlar: TolovlarService,
  ) {}

  async create(data: CreateMijozDto, sellerId: string) {
    const { name, address, note, images, phones } = data;

    const mijoz = await this.prisma.mijoz.create({
      data: {
        name,
        address,
        note,
        sellerId,
      },
    });

    if (images?.length) {
      await this.prisma.imagesClient.createMany({
        data: images.map((url) => ({
          url,
          mijozId: mijoz.id,
        })),
      });
    }
    if (phones?.length) {
      await this.prisma.phoneClient.createMany({
        data: phones.map((phone) => ({
          phoneNumber: phone,
          mijozId: mijoz.id,
        })),
      });
    }

    return mijoz;
  }

  async findAll(
    query: { page?: number; limit?: number; search?: string },
    sellerId?: string,
  ) {
    const page = query.page || 1;
    const limit: number = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const whereCondition: Prisma.MijozWhereInput = {
      sellerId,
      ...(search
        ? {
            name: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
    };

    const data = await this.prisma.mijoz.findMany({
      where: whereCondition,
      include: {
        seller: {
          select: {
            id: true,
            userName: true,
            phone: true,
            email: true,
          },
        },
        PhoneClient: true,
      },
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    });

    const totals = await this.tolovlar.getTotalNasiyaFromSchedules();

    const totalMap = new Map(totals.list.map((x) => [x.mijozId, x.total]));

    const listWithTotal = data.map((m) => ({
      ...m,
      total: totalMap.get(m.id) ?? 0,
    }));

    const totalCount = await this.prisma.mijoz.count({
      where: whereCondition,
    });

    return {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      grandTotal: totals.grandTotal,
      data: listWithTotal,
    };
  }

  async findOne(id: string) {
    const mijoz = await this.prisma.mijoz.findFirst({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            userName: true,
            phone: true,
            email: true,
          },
        },
        PhoneClient: true,
        ImagesClient: true,
      },
    });

    if (!mijoz) {
      throw new NotFoundException('Mijoz topilmadi');
    }

    return mijoz;
  }

  async getMijozDebtsCards(mijozId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { mijozId },
    });
    if (debts.length === 0) return { total: 0, debts: [] };

    const debtIds = debts.map((d) => d.id);
    const planned = await this.prisma.tolovlar.groupBy({
      by: ['debtId'],
      where: { debtId: { in: debtIds } },
      _sum: { amount: true },
    });
    const plannedMap = new Map(
      planned.map((p) => [p.debtId, Number(p._sum.amount ?? 0)]),
    );

    const schedule = await this.prisma.tolovOy.findMany({
      where: {
        status: { in: ['UNPAID', 'PENDING'] as any },
        tolov: { debtId: { in: debtIds } },
      },
      select: {
        partialAmount: true,
        tolov: { select: { debtId: true, amount: true, date: true } },
      },
      orderBy: { tolov: { date: 'asc' } },
    });

    const cutoff = new Date();
    cutoff.setHours(23, 59, 59, 999);

    type Agg = {
      remaining: number;
      nextDueDate?: Date | null;
      nextAmount: number;
      earliestOverdue?: Date | null;
      earliestOverdueAmount: number;
    };
    const map = new Map<string, Agg>();

    for (const r of schedule) {
      const id = r.tolov.debtId;
      const monthly = Number(r.tolov.amount || 0);
      const paidPart = Number(r.partialAmount || 0);
      const remainForMonth = Math.max(monthly - paidPart, 0);

      if (!map.has(id)) {
        map.set(id, {
          remaining: 0,
          nextDueDate: undefined,
          nextAmount: 0,
          earliestOverdue: undefined,
          earliestOverdueAmount: 0,
        });
      }
      const cur = map.get(id)!;

      cur.remaining += remainForMonth;

      if (
        r.tolov.date > cutoff &&
        (!cur.nextDueDate || r.tolov.date < cur.nextDueDate)
      ) {
        cur.nextDueDate = r.tolov.date;
        cur.nextAmount = remainForMonth;
      }

      if (
        r.tolov.date <= cutoff &&
        (!cur.earliestOverdue || r.tolov.date < cur.earliestOverdue)
      ) {
        cur.earliestOverdue = r.tolov.date;
        cur.earliestOverdueAmount = remainForMonth;
      }
    }

    const cards = debts.map((d) => {
      const agg = map.get(d.id);

      let nextDate = agg?.nextDueDate ?? null;
      let nextAmount = agg?.nextAmount ?? 0;

      if (!nextDate) {
        nextDate = addMonths(d.date, 1);
        nextAmount = plannedMap.get(d.id) ?? 0;
      }

      if (!nextDate && agg?.earliestOverdue) {
        nextDate = agg.earliestOverdue;
        nextAmount = agg.earliestOverdueAmount;
      }

      const plannedTotal = plannedMap.get(d.id) ?? 0;
      const remaining = agg?.remaining ?? 0;
      const progress =
        plannedTotal > 0 ? (plannedTotal - remaining) / plannedTotal : 0;

      return {
        id: d.id,
        remaining,
        nextAmount,
        nextDueDate: nextDate,
        progress: Math.max(0, Math.min(1, progress)),
      };
    });

    const active = cards.filter((c) => c.remaining > 0);

    const total = active.reduce((s, x) => s + (x.remaining || 0), 0);

    active.sort((a, b) => (b.remaining ?? 0) - (a.remaining ?? 0));

    return { total, debts: active };
  }

  async update(id: string, dto: UpdateMijozDto) {
    const mijoz = await this.findOne(id);

    return await this.prisma.mijoz.update({
      where: { id },
      data: {
        name: dto.name ?? mijoz.name,
        address: dto.address ?? mijoz.address,
        note: dto.note ?? mijoz.note,
      },
    });
  }

  async remove(id: string) {
    const mijoz = await this.findOne(id);
    return await this.prisma.mijoz.delete({ where: { id } });
  }
}
