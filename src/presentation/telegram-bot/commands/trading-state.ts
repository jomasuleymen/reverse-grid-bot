import {
	IBotCallbackQuery,
	IBotCommand,
} from '@/domain/adapters/telegram.interface';
import { UserEntity } from '@/infrastructure/entities/account/user.entity';
import { BotConfigRepository } from '@/infrastructure/repositories/trading/trading-config.repo';
import { Injectable } from '@nestjs/common';
import { getConfigText } from './common';

@Injectable()
class StartTradingCommand extends IBotCommand {
	command = 'start';
	description = 'Старт';

	constructor(private readonly botConfigRepo: BotConfigRepository) {
		super();
	}

	async exec(msg: Message, bot: TelegramBot, user: UserEntity) {
		const config = await this.botConfigRepo.findByUserId(user.id);

		if (config) {
			const text = getConfigText(config);

			bot.sendMessage(
				msg.chat.id,
				`${text}. \n The configration right?`,
				{
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: 'Start',
									callback_data: 'confirmation_start',
								},
								{
									text: 'Cancel',
									callback_data: 'cancel_start',
								},
							],
						],
					},
				},
			);
		} else {
			bot.sendMessage(msg.chat.id, 'Start button clicked');
		}
	}
}

export class StopTradingCommand extends IBotCommand {
	command = 'stop';
	description = 'Закрыть позицию';

	async exec(msg: Message, bot: TelegramBot, user: UserEntity) {
		bot.sendMessage(msg.chat.id, 'Stop button clicked');
	}
}

@Injectable()
class TradingStartConfirmationCallbackQuery extends IBotCallbackQuery {
	constructor(private readonly botConfigRepo: BotConfigRepository) {
		super();
	}

	async exec(
		query: TelegramBot.CallbackQuery,
		bot: TelegramBot,
		user: UserEntity,
	) {
		const chatId = query.message?.chat.id;
		const messageId = query.message?.message_id;
		const data = query.data;

		if (!messageId || !chatId || !data || !this.isMatch(data)) return;

		if (query.data === 'confirmation_start') {
		} else if (query.data === 'cancel_start') {
		}

		bot.editMessageReplyMarkup(
			{ inline_keyboard: [] },
			{ chat_id: chatId, message_id: messageId },
		);
		bot.answerCallbackQuery(query.id);
	}

	isMatch(data: string): boolean {
		return data === 'confirmation_start' || data === 'cancel_start';
	}
}

export const TRADING_STATE_COMMANDS = [StartTradingCommand, StopTradingCommand];
export const TRADING_STATE_CALLBACK_QUERIES = [
	TradingStartConfirmationCallbackQuery,
];
