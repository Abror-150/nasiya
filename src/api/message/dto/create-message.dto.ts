import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty()
  mijozId: string;
  @ApiProperty()
  text: string;
  @ApiProperty({ nullable: true })
  chatId: string | null;
}
