import { IsNumber, IsString } from 'class-validator';

export class CreateBotConfigDto {
	@IsNumber({}, { message: 'Тейк профит должен быть числом.' })
	takeProfit: number;

	@IsNumber({}, { message: 'Шаг сетки должен быть числом.' })
	gridStep: number;

	@IsNumber({}, { message: 'Объём сетки должен быть числом.' })
	gridVolume: number;

	@IsString({ message: 'Символ должен быть строкой.' })
	symbol: string;
}
