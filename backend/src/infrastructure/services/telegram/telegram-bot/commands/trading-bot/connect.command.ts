import { IBotCommand } from '@/domain/adapters/telegram.interface';
import { TelegramPreferencesService } from '@/infrastructure/notification/telegram-preferences.service';
import { UserService } from '@/infrastructure/user/user.service';
import { Injectable } from '@nestjs/common';
import TelegramBot, { Message } from 'node-telegram-bot-api';
import TelegramService from '../../telegram-bot.service';

@Injectable()
class ConnectToAccountCommand extends IBotCommand {
	command = 'connect';
	description = 'Связать с аккаунт';

	private readonly session: Record<number, boolean> = {};
	private isInitilizedHandler = false;

	constructor(
		private readonly userService: UserService,
		private readonly telegramService: TelegramService,
		private readonly telegramPreferencesService: TelegramPreferencesService,
	) {
		super();

		if (this.telegramService.bot) {
			this.initializeHandler(this.telegramService.bot);
		}
	}

	async exec(msg: Message, bot: TelegramBot) {
		this.session[msg.chat.id] = true;

		bot.sendMessage(msg.chat.id, 'Введите username');
	}

	private async initializeHandler(bot: TelegramBot) {
		if (this.isInitilizedHandler) return;
		this.isInitilizedHandler = true;

		bot.on('message', async (msg) => {
			const chatId = msg.chat.id;
			if (this.session[chatId]) {
				this.session[chatId] = false;

				if (!msg.text) return;

				const value = msg.text.trim();

				if (!value) return;

				try {
					const user = await this.userService.findByUsername(value);
					if (!user) {
						bot.sendMessage(chatId, 'Пользователь не найден!');
					} else {
						const preferences =
							await this.telegramPreferencesService.findByUserId(
								user.id,
							);

						await this.telegramPreferencesService.save({
							id: preferences?.id,
							chatId: msg.chat?.id,
							firstName: msg.from?.first_name,
							telegramUserId: msg.from?.id,
							username: msg.from?.username,
							userId: user.id,
						});

						bot.sendMessage(chatId, 'Успешно!');
					}
				} catch (err) {
					bot.sendMessage(chatId, 'Ошибка');
				}
			}
		});
	}
}

export const CONNECT_TO_ACCOUNT_COMMANDS = [ConnectToAccountCommand];
