import { ExchangeCredentialsType } from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import { TradingBotConfigEntity } from '@/infrastructure/entities/trading/trading-config.entity';
import { Markup } from 'telegraf';
import {
	CALLBACK_ACTIONS,
	EDIT_CONFIG_FIELD_PREFIX,
} from '../common/constants';

type EditableFields = keyof Pick<
	TradingBotConfigEntity,
	'takeProfit' | 'gridStep' | 'gridVolume' | 'symbol'
>;

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
	// accountMode: {
	// 	label: 'Режим аккаунта',
	// 	dbField: 'accountMode',
	// 	inputPrompt: 'Введите "Demo" или "Real time"',
	// 	validation: (value) => value === 'Demo' || value === 'Real time',
	// 	parse: (value) => {
	// 		return value == 'Demo'
	// 			? ExchangeCredentialsType.Testnet
	// 			: ExchangeCredentialsType.Real;
	// 	},
	// 	options: ['Demo', 'Real time'],
	// 	humanReadable: (value) => {
	// 		return value == ExchangeCredentialsType.Testnet
	// 			? 'Тестовый режим'
	// 			: 'Реальный режим';
	// 	},
	// },
	symbol: {
		label: 'Символ',
		dbField: 'symbol',
		inputPrompt: 'Введите символ',
		validation: (value) => typeof value === 'string',
		parse: (value) => value,
		humanReadable: (value) => value,
	},
};

const formActionConfig = {
	cancel: {
		label: 'Назад',
		callbackData: CALLBACK_ACTIONS.CANCEL_CONFIG_EDITING,
	},
};

const buttonRowConfig = [2, 2, 1];

export type FieldKey = EditableFields;

export class TradingUpdateBase {
	protected getFieldCallbackData(field: FieldKey) {
		return `${EDIT_CONFIG_FIELD_PREFIX}${field}`;
	}

	protected parseFieldFromCallback(callbackData: string): FieldKey {
		return callbackData.replace(EDIT_CONFIG_FIELD_PREFIX, '') as FieldKey;
	}

	protected cancelButton() {
		return Markup.button.callback(
			formActionConfig.cancel.label,
			formActionConfig.cancel.callbackData,
		);
	}

	protected createConfigKeyboard() {
		const fieldButtons = Object.entries(formFieldConfig).map(
			([key, { label }]) =>
				Markup.button.callback(
					label,
					this.getFieldCallbackData(key as FieldKey),
				),
		);

		const buttonRows = [];
		let index = 0;
		for (const rowSize of buttonRowConfig) {
			buttonRows.push(fieldButtons.slice(index, index + rowSize));
			index += rowSize;
		}

		buttonRows.push([this.cancelButton()]);
		return Markup.inlineKeyboard(buttonRows);
	}

	protected formatConfigText(config: TradingBotConfigEntity) {
		return Object.values(formFieldConfig)
			.map(
				({ dbField, label, humanReadable }) =>
					`${label}: ${config[dbField] ? humanReadable(config[dbField]) : 'Не настроен'}`,
			)
			.join('\n');
	}
}
