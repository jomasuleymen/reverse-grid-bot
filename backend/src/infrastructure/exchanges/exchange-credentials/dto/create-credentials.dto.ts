import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import { ExchangeCredentialsType } from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { IsEnum, IsString } from 'class-validator';

export class CreateCredentialsDto {
	@IsEnum(ExchangeCredentialsType)
	type: ExchangeCredentialsType;

	@IsString()
	name: string;

	@IsString()
	apiKey: string;

	@IsString()
	apiSecret: string;

	@IsEnum(ExchangeEnum)
	exchange: ExchangeEnum;
}
