import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';

export class CreateMijozDto {
  @ApiProperty()
  name: string;
  @ApiProperty()
  address: string;
  @ApiProperty()
  note: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  phones: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  images: string[];
}
