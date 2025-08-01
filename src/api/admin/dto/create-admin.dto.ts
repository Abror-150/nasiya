import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
  IsEnum,
  MinLength,
} from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'Ali Valiyev', description: 'Adminning ismi' })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    example: 'Admin@1234',
    description: 'Parol (kamida 8 ta belgidan iborat)',
  })
  @IsString()
  @MinLength(4)
  password: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'Telefon raqam (UZ format)',
  })
  @IsPhoneNumber('UZ')
  phone: string;

  @ApiProperty({ example: 'ali@example.com', description: 'Email manzil' })
  @IsEmail()
  email: string;
}
