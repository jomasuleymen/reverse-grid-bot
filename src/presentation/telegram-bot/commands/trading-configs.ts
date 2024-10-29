import {
	IBotCallbackQuery,
	IBotCommand,
} from '@/domain/adapters/telegram.interface';
import { UserEntity } from '@/infrastructure/entities/account/user.entity';
import { TradingBotConfigEntity } from '@/infrastructure/entities/trading/trading-config.entity';
import { BotConfigRepository } from '@/infrastructure/repositories/trading/trading-config.repo';
import { Injectable } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import {
	EDIT_CONFIG_FIELD_PREFIX,
	getConfigEditKeyboards,
	getConfigText,
	getEditFieldFromCallbackData,
} from './common';

@Injectable()
class EditTradingConfigCommand extends IBotCommand {
	command = 'editconfig';
	description = 'Edit config';

	constructor(private readonly botConfigRepo: BotConfigRepository) {
		super();
	}

	async exec(msg: TelegramBot.Message, bot: TelegramBot, user: UserEntity) {
		const chatId = msg.chat.id;

		const config = (await this.botConfigRepo.findByUserId(user.id, {
			createIfNotExists: true,
		}))!;

		bot.sendMessage(chatId, getConfigText(config), {
			reply_markup: {
				inline_keyboard: getConfigEditKeyboards(),
			},
		});
	}
}

@Injectable()
class EditTradingConfigCallbackQuery extends IBotCallbackQuery {
	constructor(private readonly botConfigRepo: BotConfigRepository) {
		super();
	}

	async exec(
		query: TelegramBot.CallbackQuery,
		bot: TelegramBot,
		user: UserEntity,
	) {
		const chatId = query.message?.chat.id;
		const data = query.data;

		if (!chatId || !data || !this.isMatch(data)) return;

		const field = getEditFieldFromCallbackData(data);

		// TODO: check if fields available

		bot.sendMessage(chatId, `Enter a new value for ${field}:`);
		bot.once('message', async (msg) => {
			if (msg.text) {
				const config = (await this.botConfigRepo.findByUserId(user.id, {
					createIfNotExists: true,
				}))!;

				if (field in config) {
					config[field as keyof TradingBotConfigEntity] = Number(
						msg.text,
					) as any;
				}

				await this.botConfigRepo.save(config);

				bot.sendMessage(chatId, getConfigText(config), {
					reply_markup: {
						remove_keyboard: true,
					},
				});
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
