import { PartialType } from '@nestjs/mapped-types';
import { StartBotDto } from './start-bot.dto';

export class UpdateBotDto extends PartialType(StartBotDto) {}
