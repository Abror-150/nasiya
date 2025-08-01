import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMijozDto } from './dto/create-mijoz.dto';
import { UpdateMijozDto } from './dto/update-mijoz.dto';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';

@Injectable()
export class MijozService {
  constructor(private readonly prisma: PrismaService) {}

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
    const search = query.search?.trim() || '';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.mijoz.findMany({
        where: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
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
        skip,
        take: limit,
      }),
      this.prisma.mijoz.count({
        where: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      data,
      totalPages: Math.ceil(total / limit),
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
