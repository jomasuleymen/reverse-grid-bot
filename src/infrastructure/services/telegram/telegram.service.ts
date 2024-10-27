import { IBotCommand } from '@/domain/adapters/telegram.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import sleep from 'sleep-promise';
import LoggerService from '../logger/logger.service';

@Injectable()
export class TelegramService {
	private readonly chatIds: number[] = [];
	private readonly bot?: TelegramBot;

	constructor(
		private readonly configService: ConfigService,
		private readonly logger: LoggerService,
	) {
		const botToken = this.configService.get('telegram.bot.token');
		this.chatIds = this.getChatIds();

		if (botToken) this.bot = new TelegramBot(botToken, { polling: true });
		else return;

		this.initOnErrors(this.bot);
	}

	private getChatIds() {
		const chatIds = this.configService.get('telegram.chats');

		if (Array.isArray(chatIds)) {
			return chatIds
				.map((i) => Number(i))
				.filter((i) => i && typeof i === 'number');
		}

		return [];
	}

	private initOnErrors(bot: TelegramBot) {
		bot.on('polling_error', (error) => {
			this.logger.error('Telegram polling error', { error });
		});

		bot.on('webhook_error', (error) => {
			this.logger.error('Telegram webhook error', { error });
		});
	}

	async setCommands(commands: IBotCommand[]) {
		if (!this.bot) {
			this.logger.warn('Telegram bot is not connected');
			return;
		}

		for (const command of commands) {
			this.bot.onText(new RegExp(`^${command.command}$`), (msg) => {
				const chatId = msg.chat.id;

				if (!this.chatIds.includes(chatId)) {
					this.bot!.sendMessage(chatId, 'Вам запрешено!');
					return;
				}

				command.exec(msg, this.bot!);
			});
		}

		await this.bot
			.setMyCommands(
				commands.map((command) => ({
					command: command.command,
					description: command.description,
				})),
			)
			.then((res) => {
				if (res) {
					this.logger.debug('Telegram commands set successfully');
				} else {
					this.logger.error(
						'Telegram commands can not set successfully',
					);
				}
			})
			.catch((err) => {
				this.logger.error('Telegram commands can not set', err);
			});
	}

	async sendMessage(text: string): Promise<void> {
		if (!this.bot) return;

		try {
			for (const chatId of this.chatIds) {
				await this.bot.sendMessage(chatId, text);
				await sleep(200);
			}
		} catch (telegramError) {
			this.logger.error(
				'Failed to send Telegram message:',
				telegramError as any,
			);
		}
	}
}
