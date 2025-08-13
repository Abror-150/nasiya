import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMijozDto } from './dto/create-mijoz.dto';
import { UpdateMijozDto } from './dto/update-mijoz.dto';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { TolovlarService } from '../tolovlar/tolovlar.service';

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

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page || 1;
    const limit: number = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const whereCondition: Prisma.MijozWhereInput = search
      ? {
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

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
      include: {
        ImagesDebt: true,
        mijoz: true,
      },
    });

    const debtIds = debts.map((d) => d.id);

    const schedules = await this.prisma.tolovOy.findMany({
      where: { tolov: { debtId: { in: debtIds } } },
      include: {
        tolov: true,
      },
    });

    const cards = debts.map((d) => {
      const relatedSchedule = schedules.filter((s) => s.tolov.debtId === d.id);
      const remaining = relatedSchedule.reduce(
        (sum, s) => sum + ((s.tolov.amount ?? 0) - (s.partialAmount ?? 0)),
        0,
      );
      const nextPayment =
        relatedSchedule.find((s) => s.status === 'PENDING') ?? null;

      return {
        id: d.id,
        name: d.name,
        remaining,
        nextAmount: nextPayment
          ? nextPayment.tolov.amount - (nextPayment.partialAmount ?? 0)
          : 0,
        nextDueDate: nextPayment ? nextPayment.tolov.date : null,
        progress: d.amount > 0 ? (d.amount - remaining) / d.amount : 0,
        mijoz: d.mijoz,
        ImagesDebt: d.ImagesDebt,
      };
    });

    return {
      total: cards.reduce((sum, c) => sum + c.remaining, 0),
      debts: cards,
    };
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
