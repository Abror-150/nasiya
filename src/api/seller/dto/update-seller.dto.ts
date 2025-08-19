import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsPhoneNumber,
  IsEmail,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class UpdateSellerDto {
  @ApiPropertyOptional({
    example: 'Ali Valiyev',
    description: 'Foydalanuvchi ismi',
  })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ example: 'mySecureP@ss123', description: 'Parol' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    example: '+998901234567',
    description: 'Telefon raqam',
  })
  @IsOptional()
  @IsPhoneNumber('UZ')
  phone?: string;

  @ApiPropertyOptional({
    example: 'ali@example.com',
    description: 'Email manzil',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
  @ApiPropertyOptional({
    example: 'url',
  })
  @IsOptional()
  @IsEmail()
  img?: string;
}
