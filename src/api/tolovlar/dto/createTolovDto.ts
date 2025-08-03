import { ApiProperty } from '@nestjs/swagger';
import { methodType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTolovlarDto {
  @ApiProperty()
  debtId: string;
  @ApiProperty({ example: 0 })
  @IsNotEmpty()
  amount?: number;
  @ApiProperty({ example: '2025-08-30' })
  @IsDateString({}, { message: 'date noto‘g‘ri formatda. Misol: 2025-08-30' })
  date: string;
  @ApiProperty({ example: 'ONE_MONTH' })
  @IsEnum(methodType, {
    message:
      'methodType noto‘g‘ri. ONE_MONTH, CUSTOM yoki MULTI_MONTH bo‘lishi kerak',
  })
  method: methodType;
  @ApiProperty({ required: false, example: '1oy' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({ required: false })
  months?: number[];
}
