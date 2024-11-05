import { IsNumber } from 'class-validator';

export class StopBotDto {
	@IsNumber()
	botId: number;
}
