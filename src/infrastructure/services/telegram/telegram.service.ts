import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
	private readonly chatIds = ['-4555511796'];
	private readonly bot: TelegramBot;

	constructor(private readonly configService: ConfigService) {
		this.bot = new TelegramBot(
			this.configService.getOrThrow('telegram.bot.token'),
			{ polling: true },
		);
	}

	async sendMessage(text: string): Promise<void> {
		try {
			for (const chatId of this.chatIds) {
				await this.bot.sendMessage(chatId, text);
			}
		} catch (telegramError) {
			console.error('Failed to send Telegram message:', telegramError);
		}
	}
}
