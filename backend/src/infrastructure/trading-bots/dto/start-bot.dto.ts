import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

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
	takeProfit: number;

	@IsNumber()
	gridStep: number;

	@IsNumber()
	gridVolume: number;
}
