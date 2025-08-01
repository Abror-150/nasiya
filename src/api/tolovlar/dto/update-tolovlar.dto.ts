import { PartialType } from '@nestjs/swagger';
import { CreateTolovlarDto } from './create-tolovlar.dto';

export class UpdateTolovlarDto extends PartialType(CreateTolovlarDto) {}
