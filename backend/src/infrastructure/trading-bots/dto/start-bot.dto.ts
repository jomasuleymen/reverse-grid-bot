import { IsNumber, IsString } from 'class-validator';

export class StartBotDto {
	@IsNumber()
	credentialsId: number;

	@IsString()
	baseCurrency: string;

	@IsString()
	quoteCurrency: string;

	@IsNumber()
	takeProfit: number;

	@IsNumber()
	gridStep: number;

	@IsNumber()
	gridVolume: number;
}
