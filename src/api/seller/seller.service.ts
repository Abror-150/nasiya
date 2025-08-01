import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { BcryptEncryption } from 'src/infrastructure/lib/bcrypt';
import { log } from 'console';

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

  async Register(data: CreateSellerDto) {
    const { balance } = data;
    const existing = await this.prisma.seller.findFirst({
      where: { phone: data.phone },
    });
    const existing2 = await this.prisma.seller.findFirst({
      where: { userName: data.userName },
    });

    if (existing) {
      return { message: 'Bu telefon raqam bilan seller allaqachon mavjud.' };
    }
    if (existing2) {
      return { message: 'Bu userName  bilan seller allaqachon mavjud.' };
    }
    const hashed = await BcryptEncryption.encrypt(data.password);
    console.log(hashed);

    const created = await this.prisma.seller.create({
      data: { ...data, password: hashed, balance: 0 },
    });
    return created;
  }

  async findAll() {
    const sellers = await this.prisma.seller.findMany({
      select: { id: true, userName: true, email: true, phone: true },
    });

    return sellers;
  }

  async findOne(id: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      select: { id: true, userName: true, email: true, phone: true },
    });

    if (!seller) {
      return { message: `ID ${id} bilan seller topilmadi.` };
    }

    return seller;
  }

  async update(id: string, data: UpdateSellerDto) {
    const exists = await this.prisma.seller.findUnique({ where: { id } });

    if (!exists) {
      return { message: `ID ${id} bilan seller mavjud emas.` };
    }

    const updated = await this.prisma.seller.update({
      where: { id },
      data,
    });

    return updated;
  }

  async remove(id: string) {
    const exists = await this.prisma.seller.findUnique({ where: { id } });

    if (!exists) {
      return { message: `ID ${id} bilan seller mavjud emas.` };
    }

    await this.prisma.seller.delete({ where: { id } });
    return { message: `ID ${id} bilan seller muvaffaqiyatli o‘chirildi.` };
  }
}
