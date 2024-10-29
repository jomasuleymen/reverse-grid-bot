import { TradingBotConfigEntity } from '@/infrastructure/entities/trading/trading-config.entity';
import _ from 'lodash';
import { InlineKeyboardButton } from 'node-telegram-bot-api';

type TradingBotConfigEntitySubset = Pick<
	TradingBotConfigEntity,
	'closeAtPrice'
>;

export const botConfigFields: Array<
	Array<{
		field: keyof TradingBotConfigEntitySubset;
		btnText: string;
	}>
> = [
	[
		{
			field: 'closeAtPrice',
			btnText: 'Тейк профит',
		},
		{
			field: 'closeAtPrice',
			btnText: 'Тейк профит',
		},
	],
];

export const EDIT_CONFIG_FIELD_PREFIX: string = 'edit_trading_config_';

export const getConfigEditFieldCallbackData = (field: string) =>
	`${EDIT_CONFIG_FIELD_PREFIX}${field}`;

export const getEditFieldFromCallbackData = (callbackData: string) =>
	callbackData.replace(EDIT_CONFIG_FIELD_PREFIX, '');

export const getConfigEditKeyboards = (): InlineKeyboardButton[][] => {
	return botConfigFields.map((columns) =>
		columns.map(({ field, btnText }) => ({
			text: btnText,
			callback_data: getConfigEditFieldCallbackData(field),
		})),
	);
};

export const getConfigText = (config: TradingBotConfigEntity) => {
	return _.flattenDeep(botConfigFields)
		.map(
			(fieldData) =>
				`${fieldData.btnText}: ${config[fieldData.field] || 'Не настроен'}`,
		)
		.join('\n');
};
