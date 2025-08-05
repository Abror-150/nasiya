import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsPhoneNumber,
  IsEmail,
  IsOptional,
  MinLength,
} from 'class-validator';

export class UpdateAdminDto {
  @ApiPropertyOptional({
    example: 'Ali Valiyev',
    description: 'Adminning ismi',
  })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({
    example: 'Admin@1234',
    description: 'Parol (kamida 8 ta belgidan iborat)',
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @ApiPropertyOptional({
    example: '+998901234567',
    description: 'Telefon raqam (UZ format)',
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
}
