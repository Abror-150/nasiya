import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsEmail,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateSellerDto {
  @ApiProperty({ example: 'Ali Valiyev', description: 'Foydalanuvchi ismi' })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({ example: 'mySecureP@ss123', description: 'Parol' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam' })
  @IsPhoneNumber('UZ')
  phone: string;

  @ApiProperty({ example: 'ali@example.com', description: 'Email manzil' })
  @IsEmail()
  email: string;

  balance: number;
}
