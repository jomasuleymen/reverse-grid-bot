import { TelegramPreferencesService } from '@/infrastructure/notification/telegram-preferences.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isNumber } from 'lodash';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { BotCommand } from 'telegraf/typings/core/types/typegram';
import LoggerService from '../logger/logger.service';

@Injectable()
export class TelegramService {
	private readonly allowedUserIds: Set<number>;
	public readonly commands: BotCommand[] = [];

	constructor(
		private readonly configService: ConfigService,
		private readonly logger: LoggerService,
		private readonly telegramAccountsService: TelegramPreferencesService,
		@InjectBot() public readonly bot: Telegraf,
	) {
		this.allowedUserIds = new Set(this.getAllowedUserIds());

		if (this.allowedUserIds.size) {
			this.logger.info(
				`Telegram bot - allowed user ids: ${Array.from(this.allowedUserIds)}`,
			);
		} else {
			this.logger.warn('Telegram bot has not allowed users');
		}

		this.handleErrors();
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

		this.bot.catch((err) => {
			this.logger.error('Telegram bot error', err);
		});
	}

	public addMyCommands(commands: BotCommand[]) {
		this.commands.push(...commands);
	}

	public isUserAllowed(userId: any) {
		return isNumber(userId) && this.allowedUserIds.has(userId);
	}

	public async sendMessage(userId: number, message: string) {
		if (!this.bot) return;

		const account = await this.telegramAccountsService.findByUserId(userId);
		if (!account) return;

		try {
			await this.bot.telegram.sendMessage(account.chatId, message);
		} catch (err) {}
	}

	public async updateBotCommands(): Promise<void> {
		if (!this.bot) return;

		const botCommands = this.commands.map((command) => ({
			command: command.command,
			description: command.description,
		}));

		try {
			// Retrieve existing bot commands
			const alreadyHasCommands = await this.bot.telegram.getMyCommands();

			// Check if there's any difference between the existing and new commands
			const commandsAreDifferent =
				JSON.stringify(alreadyHasCommands) !==
				JSON.stringify(botCommands);

			// Update commands only if there’s a difference
			if (commandsAreDifferent) {
				const result =
					await this.bot.telegram.setMyCommands(botCommands);
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
}

export default TelegramService;
