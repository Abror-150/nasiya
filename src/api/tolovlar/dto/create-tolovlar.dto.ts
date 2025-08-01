import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {  methodType2 } from 'src/common/enum';

export class CreateTolovlarDto {
  @ApiProperty()
  debtId: string;
  @ApiProperty({ example: 0 })
  @IsNotEmpty()
  amount: number;
  @ApiProperty({ example: '2025-08-30' })
  @IsDateString({}, { message: 'date noto‘g‘ri formatda. Misol: 2025-08-30' })
  date: string;
  @ApiProperty({ example: 'FULL' })
  @IsEnum(methodType2, {
    message:
      'methodType noto‘g‘ri. FULL, PARTIAL yoki BY_DURATION bo‘lishi kerak',
  })
  method: methodType2;
  @ApiProperty({ required: false, example: '1oy' })
  @IsOptional()
  @IsString()
  duration: string;
}
