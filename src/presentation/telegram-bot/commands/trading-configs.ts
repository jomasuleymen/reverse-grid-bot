import {
	IBotCallbackQuery,
	IBotCommand,
} from '@/domain/adapters/telegram.interface';
import TelegramBot from 'node-telegram-bot-api';

const EDIT_CONFIG_FIELD_PREFIX: string = 'edit_trading_config_';

const getCallbackData = (field: string) =>
	`${EDIT_CONFIG_FIELD_PREFIX}${field}`;
const getFieldFromCallbackData = (callbackData: string) =>
	callbackData.replace(EDIT_CONFIG_FIELD_PREFIX, '');

class EditTradingConfigCommand extends IBotCommand {
	command = 'editconfig';
	description = 'Edit config';

	async exec(msg: TelegramBot.Message, bot: TelegramBot) {
		const chatId = msg.chat.id;

		const configFields = ['gridCount'];

		const keyboard: TelegramBot.InlineKeyboardMarkup = {
			inline_keyboard: configFields.map((field) => [
				{
					text: `Edit ${field}`,
					callback_data: getCallbackData(field),
				},
			]),
		};

		bot.sendMessage(chatId, 'Select a configuration field to edit:', {
			reply_markup: keyboard,
		});
	}
}

class EditTradingConfigCallbackQuery extends IBotCallbackQuery {
	async exec(query: TelegramBot.CallbackQuery, bot: TelegramBot) {
		const chatId = query.message?.chat.id;
		const data = query.data;

		if (!chatId || !data || !this.isMatch(data)) return;

		const field = getFieldFromCallbackData(data);

		// TODO: check if fields available

		bot.sendMessage(chatId, `Enter a new value for ${field}:`);
		bot.once('message', async (msg) => {
			if (msg.text) {
				bot.sendMessage(
					chatId,
					`Configuration updated: ${field} = ${msg.text}`,
				);
			} else {
				bot.sendMessage(chatId, 'Invalid input. Please try again.');
			}
		});

		bot.answerCallbackQuery(query.id);
	}

	isMatch(data: string): boolean {
		return data.startsWith(EDIT_CONFIG_FIELD_PREFIX);
	}
}

export const TRADING_CONFIGS_COMMANDS = [EditTradingConfigCommand];
export const TRADING_CONFIGS_CALLBACK_QUERIES = [
	EditTradingConfigCallbackQuery,
];
