import {
	IBotCallbackQuery,
	IBotCommand,
} from '@/domain/adapters/telegram.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import LoggerService from '../logger/logger.service';
import { UserRepository } from '@/infrastructure/repositories/account/user.repo';

@Injectable()
export class TelegramService {
	private readonly bot?: TelegramBot;
	private readonly allowedUserIds: Set<number>;

	constructor(
		private readonly configService: ConfigService,
		private readonly logger: LoggerService,
		private readonly userRepo: UserRepository,
	) {
		const botToken = this.configService.get<string>('telegram.bot.token');
		this.allowedUserIds = new Set(this.getAllowedUserIds());

		if (this.allowedUserIds.size) {
			this.logger.info(
				`Telegram bot - allowed user ids: ${Array.from(this.allowedUserIds)}`,
			);
		} else {
			this.logger.warn('Telegram bot has not allowed users');
		}

		if (botToken) {
			this.bot = new TelegramBot(botToken, { polling: true });
			this.handleErrors();
		} else {
			this.logger.warn('Telegram bot token not provided');
		}
	}

	private getAllowedUserIds(): number[] {
		const chatIds = this.configService.get<(string | number)[]>(
			'telegram.allowedUserIds',
		);
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

	async useCallbackQueries(callbackQueries: IBotCallbackQuery[]) {
		if (!this.bot) {
			this.logger.warn('Telegram bot is not initialized');
			return;
		}

		// Listen for callback queries from inline keyboard buttons
		this.bot.on(
			'callback_query',
			async (query: TelegramBot.CallbackQuery) => {
				try {
					const chatId = query.message?.chat.id;
					const userId = query.from.id;
					const data = query.data;

					if (!chatId || !data) return;

					const foundExecutor = callbackQueries.find((executor) =>
						executor.isMatch(data),
					);

					if (!foundExecutor) return;
					let user = await this.userRepo.findByTelegramUserId(
						userId!,
					);

					if (!user)
						user = await this.userRepo.saveUser({
							chatId,
							telegramUserId: userId!,
							firstName: query.from?.first_name!,
							username: query.from?.username!,
						});
					await foundExecutor.exec(query, this.bot!, user);
				} catch (err: any) {
					this.logger.fatal(
						'Telegram callback query handler exception',
						err,
					);
				}
			},
		);
	}

	private registerCommandHandlers(commands: IBotCommand[]): void {
		if (!this.bot) return;

		for (const command of commands) {
			this.bot.onText(
				new RegExp(`^/${command.command}$`),
				async (msg) => {
					try {
						const chatId = msg.chat.id;
						const userId = msg.from?.id;

						if (!this.checkIsUserAllowed(userId)) {
							this.bot!.sendMessage(
								chatId,
								`Доступ запрещен. ${userId}`,
							);
							return;
						}

						let user = await this.userRepo.findByTelegramUserId(
							userId!,
						);

						if (!user)
							user = await this.userRepo.saveUser({
								chatId,
								telegramUserId: userId!,
								firstName: msg.from?.first_name!,
								username: msg.from?.username!,
							});

						await command.exec(msg, this.bot!, user);
					} catch (err: any) {
						this.logger.fatal(
							'Telegram command handler exception',
							err,
						);
					}
				},
			);
		}
	}

	private checkIsUserAllowed(userId: any) {
		return userId && this.allowedUserIds.has(userId);
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
