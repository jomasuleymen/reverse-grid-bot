import { TradePosition } from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class StartBotDto {
	@IsNumber()
	credentialsId: number;

	@IsString()
	@Transform(({ value }) => {
		if (typeof value === 'string') value = value.toUpperCase();

		return value;
	})
	baseCurrency: string;

	@IsString()
	@Transform(({ value }) => {
		if (typeof value === 'string') value = value.toUpperCase();

		return value;
	})
	quoteCurrency: string;

	@IsNumber()
	@IsOptional()
	takeProfitOnGrid?: number;

	@IsNumber()
	@IsOptional()
	takeProfit?: number;

	@IsNumber()
	@IsOptional()
	triggerPrice?: number;

	@IsNumber()
	gridStep: number;

	@IsNumber()
	gridVolume: number;

	@IsEnum(TradePosition)
	position: TradePosition;
}
