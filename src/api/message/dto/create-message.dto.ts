import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty()
  mijozId: string;
  @ApiProperty()
  text: string;
  @ApiProperty({ example: 'string' })
  chatId: string | null;
}
