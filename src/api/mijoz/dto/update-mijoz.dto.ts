import { PartialType } from '@nestjs/swagger';
import { CreateMijozDto } from './create-mijoz.dto';

export class UpdateMijozDto extends PartialType(CreateMijozDto) {}
