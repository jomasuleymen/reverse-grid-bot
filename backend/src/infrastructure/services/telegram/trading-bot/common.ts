import { TradingBotConfigEntity } from '@/infrastructure/trading-bots/configurations/entities/trading-config.entity';

type EditableFields = keyof Pick<
	TradingBotConfigEntity,
	'takeProfit' | 'gridStep' | 'gridVolume' | 'baseCurrency' | 'quoteCurrency'
>;

export const CALLBACK_ACTIONS = {
	CONFIRM_START: 'confirm_start',
	CANCEL_START: 'cancel_start',
};

export const formFieldConfig: Record<
	EditableFields,
	{
		label: string;
		dbField: EditableFields;
		inputPrompt: string;
		humanReadable: (value: any) => string;
		validation: (value: any) => boolean;
		parse: (value: any) => any;
		options?: string[];
	}
> = {
	takeProfit: {
		label: 'Тейк профит',
		dbField: 'takeProfit',
		inputPrompt: 'Введите значение для тейк профита',
		validation: (value) => !isNaN(Number(value)),
		parse: (value) => Number(value),
		humanReadable: (value) => Number(value).toString(),
	},
	gridStep: {
		label: 'Шаг сетки',
		dbField: 'gridStep',
		inputPrompt: 'Введите значение для шага сетки',
		validation: (value) => !isNaN(Number(value)),
		parse: (value) => Number(value),
		humanReadable: (value) => Number(value).toString(),
	},
	gridVolume: {
		label: 'Объём сетки',
		dbField: 'gridVolume',
		inputPrompt: 'Введите значение для объёма сетки(в базовая монета)',
		validation: (value) => !isNaN(Number(value)),
		parse: (value) => Number(value),
		humanReadable: (value) => Number(value).toString(),
	},
	baseCurrency: {
		label: 'Базовая валюта',
		dbField: 'baseCurrency',
		inputPrompt: 'Базовая валюта',
		validation: (value) => typeof value === 'string',
		parse: (value) => value,
		humanReadable: (value) => value,
	},
	quoteCurrency: {
		label: 'Котируемая валюта',
		dbField: 'quoteCurrency',
		inputPrompt: 'Введите Котируемая валюта',
		validation: (value) => typeof value === 'string',
		parse: (value) => value,
		humanReadable: (value) => value,
	},
};

export type FieldKey = EditableFields;

export class TradingUpdateBase {
	protected formatConfigText(config: TradingBotConfigEntity) {
		return Object.values(formFieldConfig)
			.map(
				({ dbField, label, humanReadable }) =>
					`${label}: ${config[dbField] ? humanReadable(config[dbField]) : 'Не настроен'}`,
			)
			.join('\n');
	}
}
