import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExampleDto } from './dto/create-example.dto';
import { UpdateExampleDto } from './dto/update-example.dto';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';

@Injectable()
export class ExampleService {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: CreateExampleDto, sellerId: string) {
    let created = await this.prisma.namuna.create({
      data: {
        text: data.text,
        sellerId,
      },
    });
    return created;
  }

  async findAll() {
    let data = await this.prisma.namuna.findMany();
    return data;
  }

  async findOne(id: string) {
    let one = await this.prisma.namuna.findFirst({ where: { id } });
    if (!one) {
      throw new NotFoundException('namuna topilmadi');
    }
    return one;
  }

  async update(id: string, data: UpdateExampleDto) {
    await this.findOne(id);
    let updated = await this.prisma.namuna.update({ where: { id }, data });
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id)
    const deleted = await this.prisma.namuna.delete({where:{id}})
    return deleted
  }
}
