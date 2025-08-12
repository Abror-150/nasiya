import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateDebtDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  mijozId: string;
  @ApiProperty()
  amount: number;
  @ApiProperty({ example: '2025-07-31' })
  @IsDateString({}, { message: 'date noto‘g‘ri formatda. Misol: 2025-07-31' })
  date: string;
  @ApiProperty({ example: '1 oy' })
  muddat: string;
  @ApiProperty()
  note: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  images: string[];
}
