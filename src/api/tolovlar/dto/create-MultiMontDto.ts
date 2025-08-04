import { ApiProperty } from '@nestjs/swagger';
import { methodType } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  ArrayMinSize,
  Min,
} from 'class-validator';

export class CreateMultiMonthDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  debtId: string;
  @ApiProperty({ example: methodType.MULTI_MONTH })
  @IsEnum(methodType)
  method: methodType = methodType.MULTI_MONTH;
  @ApiProperty({ example: '2025-08-30' })
  @IsDateString()
  date: string;
  @ApiProperty({ type: [Number], example: [1, 2] })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  months: number[];
  @ApiProperty()
  duration?: string;
}
