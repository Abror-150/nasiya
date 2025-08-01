import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaService } from 'src/infrastructure/lib/prisma/prisma.service';
import { BcryptEncryption } from 'src/infrastructure/lib/bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(data: CreateAuthDto) {
    const { userName, password } = data;

    const seller = await this.prisma.seller.findFirst({
      where: { userName },
    });

    const admin = await this.prisma.admin.findFirst({ where: { userName } });


    const user = seller || admin;
    const role = seller ? 'seller' : admin ? 'admin' : null;

    if (!user) {
      throw new NotFoundException('Bunday foydalanuvchi topilmadi');
    }

    const isMatch = await BcryptEncryption.compare(password, user.password);
    console.log(password, user.password);

    if (!isMatch) {
      throw new BadRequestException('Parol noto‘g‘ri');
    }

    const token = this.jwt.sign({
      id: user.id,
      role,
    });

    return { message: token };
  }
}
