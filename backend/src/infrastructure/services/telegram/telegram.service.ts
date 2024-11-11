import {
	IBotCallbackQuery,
	IBotCommand,
} from '@/domain/adapters/telegram.interface';
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
			this.bot = new TelegramBot(botToken, { polling: true });
			this.handleErrors();
		} else {
			this.logger.warn('Telegram bot token not provided');
		}
	}

	private handleErrors(): void {
		if (!this.bot) return;

		this.bot.on('polling_error', (error) => {
			// this.logger.error('Telegram polling error', { error });
		});

		this.bot.on('webhook_error', (error) => {
			// this.logger.error('Telegram webhook error', { error });
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

	async useCallbackQueries(callbackQueries: IBotCallbackQuery[]) {
		if (!this.bot) {
			this.logger.warn('Telegram bot is not initialized');
			return;
		}

		// Listen for callback queries from inline keyboard buttons
		this.bot.on('callback_query', (query: TelegramBot.CallbackQuery) => {
			const chatId = query.message?.chat.id;
			const data = query.data;
			if (!chatId || !data) return;
			const foundExecutor = callbackQueries.find((executor) =>
				executor.isMatch(data),
			);
			if (foundExecutor)
				foundExecutor.exec(query, this.bot!).catch((err) => {
					this.logger.error(
						'Error while serving telegram callback query',
						{
							callback_query: query.data,
							from: query.from,
							err,
						},
					);
				});
		});
	}

	private registerCommandHandlers(commands: IBotCommand[]): void {
		if (!this.bot) return;

		for (const command of commands) {
			this.bot.onText(new RegExp(`^/${command.command}$`), (msg) => {
				command.exec(msg, this.bot!).catch((err) => {
					this.logger.error('Error while serving telegram command', {
						command: command.command,
						from: msg.from,
						err,
					});
				});
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
			// Retrieve existing bot commands
			const alreadyHasCommands = await this.bot.getMyCommands();

			// Check if there's any difference between the existing and new commands
			const commandsAreDifferent =
				JSON.stringify(alreadyHasCommands) !==
				JSON.stringify(botCommands);

			// Update commands only if there’s a difference
			if (commandsAreDifferent) {
				const result = await this.bot.setMyCommands(botCommands);
				if (result) {
					this.logger.info('Telegram commands set successfully');
				} else {
					this.logger.error('Failed to set Telegram commands');
				}
			} else {
				this.logger.info('No updates needed for Telegram commands');
			}
		} catch (error) {
			this.logger.error('Error setting Telegram commands', { error });
		}
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
