import { BotState } from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class GetTradingBotsDto {
	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => {
		if (value === 'true' || value === true) return true;
		if (value === 'false' || value === false) return false;
		return value;
	})
	isActive?: boolean;

	@IsOptional()
	@IsEnum(BotState)
	state?: BotState;
}
