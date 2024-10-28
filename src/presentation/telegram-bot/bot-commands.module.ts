import {
	IBotCallbackQuery,
	IBotCommand,
} from '@/domain/adapters/telegram.interface';
import { TelegramService } from '@/infrastructure/services/telegram/telegram.service';
import { Module, OnModuleInit } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import {
	TRADING_CONFIGS_CALLBACK_QUERIES,
	TRADING_CONFIGS_COMMANDS,
} from './commands/trading-configs';
import { TRADING_STATE_COMMANDS } from './commands/trading-state';

@Module({
	imports: [DiscoveryModule],
	providers: [
		...TRADING_CONFIGS_COMMANDS,
		...TRADING_STATE_COMMANDS,
		...TRADING_CONFIGS_CALLBACK_QUERIES,
	],
})
export class TelegramBotCommandsModule implements OnModuleInit {
	constructor(
		private readonly telegramService: TelegramService,
		private readonly discoveryService: DiscoveryService,
	) {}

	async onModuleInit() {
		this.initializeCommands();
		this.initializeCallbackQueries();
	}

	// Initialize and set commands in TelegramService
	private initializeCommands() {
		const commands = this.findProvidersByClass<IBotCommand>(IBotCommand);
		this.telegramService.setCommands(commands);
	}

	// Initialize and apply callback queries in TelegramService
	private initializeCallbackQueries() {
		const callbackQueries =
			this.findProvidersByClass<IBotCallbackQuery>(IBotCallbackQuery);
		this.telegramService.useCallbackQueries(callbackQueries);
	}

	// Helper method to discover providers extending a specific abstract class/interface
	private findProvidersByClass<T>(abstractClass: Function): T[] {
		return this.discoveryService
			.getProviders()
			.map((wrapper) => wrapper.instance)
			.filter(
				(instance): instance is T => instance instanceof abstractClass,
			);
	}
}
