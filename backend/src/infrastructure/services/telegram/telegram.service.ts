import { TelegramPreferencesService } from '@/infrastructure/notification/telegram-preferences.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import LoggerService from '../logger/logger.service';

@Injectable()
export class TelegramService {
	public readonly bot?: TelegramBot;

	constructor(
		private readonly configService: ConfigService,
		private readonly telegramPreferencesService: TelegramPreferencesService,
		private readonly logger: LoggerService,
	) {
		const botToken = this.configService.get<string>('telegram.bot.token');

		if (botToken) {
			this.bot = new TelegramBot(botToken, { polling: false });
			this.handleErrors();
		} else {
			this.logger.warn('Telegram bot token not provided');
		}
	}

	private handleErrors(): void {
		if (!this.bot) return;

		this.bot.on('polling_error', (error) => {});

		this.bot.on('webhook_error', (error) => {});
	}

	public async sendMessage(userId: number, message: string) {
		if (!this.bot) return;

		const account =
			await this.telegramPreferencesService.findByUserId(userId);
		if (!account) return;

		try {
			await this.bot.sendMessage(account.chatId, message);
		} catch (err) {}
	}
}

export default TelegramService;
