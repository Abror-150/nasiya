import { IsDateString, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { methodType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOneMonthDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  debtId: string;
  @ApiProperty({ example: methodType.ONE_MONTH })
  @IsEnum(methodType)
  method: methodType = methodType.ONE_MONTH;
  @ApiProperty({ example: '2025-09-01' })
  @IsDateString()
  date: string;
  @ApiProperty()
  duration: string;
}
