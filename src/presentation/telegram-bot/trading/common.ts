import { ITelegramBotButton } from '@/domain/adapters/telegram.interface';
import { TradingBotConfigEntity } from '@/infrastructure/entities/trading/trading-config.entity';
import _ from 'lodash';
import { Markup } from 'telegraf';
import {
	EDIT_CONFIG_FIELD_PREFIX,
	CALLBACK_ACTIONS,
} from '../common/constants';

type TradingBotEditFieldType = keyof Pick<
	TradingBotConfigEntity,
	'closeAtPrice'
>;

export class TradingUpdateBase {
	// Generates callback data for a field edit
	protected getFieldCallbackData = (field: string) =>
		`${EDIT_CONFIG_FIELD_PREFIX}${field}`;

	// Parses the field name from callback data
	protected parseFieldFromCallback = (
		callbackData: TradingBotEditFieldType,
	) => callbackData.replace(EDIT_CONFIG_FIELD_PREFIX, '');

	// Predefined cancel button
	protected cancelButton: ITelegramBotButton = {
		text: 'Cancel',
		callbackData: CALLBACK_ACTIONS.CANCEL_CONFIG_EDITING,
	};

	// Creates a single button markup
	protected createButton = ({ text, callbackData }: ITelegramBotButton) =>
		Markup.button.callback(text, callbackData);

	// Creates inline keyboard for bot configuration
	protected createConfigKeyboard = () => {
		const buttons: ITelegramBotButton[][] = [
			[
				{
					text: 'Тейк профит',
					callbackData: this.getFieldCallbackData('closeAtPrice'),
				},
			],
			[this.cancelButton],
		];

		return Markup.inlineKeyboard(
			buttons.map((row) => row.map(this.createButton)),
		);
	};

	// Formats the bot config for display
	protected formatConfigText = (config: TradingBotConfigEntity) =>
		Object.entries(_.pick(config, ['closeAtPrice']))
			.map(([key, value]) => `${key}: ${value || 'Не настроен'}`)
			.join('\n');
}
