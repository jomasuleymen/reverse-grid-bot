import { IBotCommand } from '@/domain/adapters/telegram.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import LoggerService from '../logger/logger.service';

@Injectable()
export class TelegramService {
	private readonly bot?: TelegramBot;
	private readonly allowedUserIds: Set<number>;

	constructor(
		private readonly configService: ConfigService,
		private readonly logger: LoggerService,
	) {
		const botToken = this.configService.get<string>('telegram.bot.token');
		this.allowedUserIds = new Set(this.getAllowedUserIds());

		if (botToken) {
			this.bot = new TelegramBot(botToken, { polling: true });
			this.handleErrors();
		} else {
			this.logger.warn('Telegram bot token not provided');
		}
	}

	private getAllowedUserIds(): number[] {
		const chatIds =
			this.configService.get<(string | number)[]>('allowed-user-ids');
		return Array.isArray(chatIds)
			? chatIds.map(Number).filter(Number.isInteger)
			: [];
	}

	private handleErrors(): void {
		if (!this.bot) return;

		this.bot.on('polling_error', (error) => {
			this.logger.error('Telegram polling error', { error });
		});

		this.bot.on('webhook_error', (error) => {
			this.logger.error('Telegram webhook error', { error });
		});
	}

	async setCommands(commands: IBotCommand[]): Promise<void> {
		if (!this.bot) {
			this.logger.warn('Telegram bot is not initialized');
			return;
		}

		this.registerCommandHandlers(commands);
		await this.updateBotCommands(commands);
	}

	private registerCommandHandlers(commands: IBotCommand[]): void {
		if (!this.bot) return;

		for (const command of commands) {
			this.bot.onText(new RegExp(`^${command.command}$`), (msg) => {
				const chatId = msg.chat.id;
				const userId = msg.from?.id;

				if (!userId || !this.allowedUserIds.has(userId)) {
					this.bot!.sendMessage(chatId, 'Access denied.');
					return;
				}

				command.exec(msg, this.bot!);
			});
		}
	}

	private async updateBotCommands(commands: IBotCommand[]): Promise<void> {
		if (!this.bot) return;

		const botCommands = commands.map((command) => ({
			command: command.command,
			description: command.description,
		}));

		try {
			const result = await this.bot.setMyCommands(botCommands);
			if (result) {
				this.logger.debug('Telegram commands set successfully');
			} else {
				this.logger.error('Failed to set Telegram commands');
			}
		} catch (error) {
			this.logger.error('Error setting Telegram commands', { error });
		}
	}

	async sendMessage(chatId: number, text: string): Promise<void> {
		if (!this.bot) return;

		try {
			await this.bot.sendMessage(chatId, text);
		} catch (error) {
			this.logger.error('Failed to send Telegram message', {
				error,
				chatId,
			});
		}
	}
}

export default TelegramService;
