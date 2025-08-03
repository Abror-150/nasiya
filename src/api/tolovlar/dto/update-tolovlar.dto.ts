import { PartialType } from '@nestjs/swagger';
import { CreateTolovlarDto } from './createTolovDto';

export class UpdateTolovlarDto extends PartialType(CreateTolovlarDto) {}
