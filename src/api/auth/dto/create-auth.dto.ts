import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({ example: 'Ali Valiyev' })
  @IsNotEmpty()
  @IsString()
  userName: string;
  @ApiProperty({ example: 'mySecureP@ss123' })
  @IsNotEmpty()
  password: string;
}
