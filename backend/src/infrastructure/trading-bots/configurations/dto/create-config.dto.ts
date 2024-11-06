import { IsNumber, IsString } from 'class-validator';

export class CreateBotConfigDto {
	@IsNumber({}, { message: 'Тейк профит число сетки должен быть числом.' })
	takeProfitOnGrid: number;

	@IsNumber({}, { message: 'Шаг сетки должен быть числом.' })
	gridStep: number;

	@IsNumber({}, { message: 'Объём сетки должен быть числом.' })
	gridVolume: number;

	@IsString({ message: 'Базовая валюта должен быть строкой.' })
	baseCurrency: string;

	@IsString({ message: 'Котируемая валюта должен быть строкой.' })
	quoteCurrency: string;
}
