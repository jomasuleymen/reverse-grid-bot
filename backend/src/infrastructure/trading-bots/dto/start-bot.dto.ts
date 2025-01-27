import { TradePosition } from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { Transform } from 'class-transformer';
import {
	IsBoolean,
	IsEnum,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
} from 'class-validator';

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
	@IsPositive()
	takeProfitOnGrid?: number;

	@IsNumber()
	@IsOptional()
	takeProfitOnPnl?: number;

	@IsNumber()
	@IsOptional()
	@IsPositive()
	takeProfit?: number;

	@IsNumber()
	@IsOptional()
	@IsPositive()
	triggerPrice?: number;

	@IsBoolean()
	@IsOptional()
	tradeOnStart?: boolean;

	@IsNumber()
	@IsPositive()
	gridStep: number;

	@IsNumber()
	@IsPositive()
	gridVolume: number;

	@IsEnum(TradePosition)
	position: TradePosition;
}
