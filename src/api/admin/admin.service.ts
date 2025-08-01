import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { BcryptEncryption } from 'src/infrastructure/lib/bcrypt';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAdminDto) {
    const exists = await this.prisma.admin.findFirst({
      where: { phone: data.phone },
    });

    if (exists) {
      return { message: 'Bu telefon raqam bilan admin allaqachon mavjud.' };
    }
    const hashed = await BcryptEncryption.encrypt(data.password);

    const created = await this.prisma.admin.create({
      data: { ...data, password: hashed },
    });
    return created;
  }

  async findAll() {
    const admins = await this.prisma.admin.findMany({
      select: {
        id: true,
        userName: true,
        email: true,
        phone: true,
      },
    });

    return admins;
  }

  async findOne(id: string) {
    const one = await this.prisma.admin.findUnique({
      where: { id },
      select: { userName: true, email: true, phone: true },
    });

    if (!one) {
      return { message: `ID ${id} bilan admin topilmadi.` };
    }

    return one;
  }

  async update(id: string, data: UpdateAdminDto) {
    const exists = await this.prisma.admin.findUnique({ where: { id } });

    if (!exists) {
      return { message: `ID ${id} bilan admin mavjud emas.` };
    }

    const updated = await this.prisma.admin.update({
      where: { id },
      data,
    });

    return updated;
  }

  async remove(id: string) {
    const exists = await this.prisma.admin.findUnique({ where: { id } });

    if (!exists) {
      return { message: `ID ${id} bilan admin mavjud emas.` };
    }

    await this.prisma.admin.delete({ where: { id } });
    return { message: `ID ${id} bilan admin muvaffaqiyatli o‘chirildi.` };
  }
}
