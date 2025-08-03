import { ApiProperty } from '@nestjs/swagger';
import { methodType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateCustomDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  debtId: string;
  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number;
  @ApiProperty({ example: methodType.CUSTOM })
  @IsEnum(methodType)
  method: methodType = methodType.CUSTOM;
  @ApiProperty()
  @IsDateString()
  date: string;
}
