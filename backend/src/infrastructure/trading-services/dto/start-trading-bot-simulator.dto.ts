import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';

const minTimestamp = new Date('2010-01-01').getTime();

export class StartTradingBotSimulatorDto {
	@IsString({ message: 'Базовая валюта должен быть строкой.' })
	baseCurrency: string;

	@IsString({ message: 'Котируемая валюта должен быть строкой.' })
	quoteCurrency: string;

	@IsNumber({}, { message: 'Шаг сетки должен быть числом.' })
	gridStep: number;

	@IsNumber({}, { message: 'Объём сетки должен быть числом.' })
	gridVolume: number;

	@IsInt()
	@Min(minTimestamp)
	@Transform(({ value }) => {
		if (value) return new Date(value).getTime();
		return false;
	})
	startTime: number;

	@IsInt()
	@Min(minTimestamp)
	@Transform(({ value }) => {
		if (value) return new Date(value).getTime();
		return false;
	})
	endTime: number;
}
