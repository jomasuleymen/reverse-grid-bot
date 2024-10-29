import {
	IBotCallbackQuery,
	IBotCommand,
} from '@/domain/adapters/telegram.interface';
import { RepositoriesModule } from '@/infrastructure/repositories/repositories.module';
import { TelegramService } from '@/infrastructure/services/telegram/telegram.service';
import { Module, OnModuleInit } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import {
	TRADING_CONFIGS_CALLBACK_QUERIES,
	TRADING_CONFIGS_COMMANDS,
} from './commands/trading-configs';
import {
	TRADING_STATE_CALLBACK_QUERIES,
	TRADING_STATE_COMMANDS,
} from './commands/trading-state';

@Module({
	imports: [DiscoveryModule, RepositoriesModule],
	providers: [
		...TRADING_CONFIGS_COMMANDS,
		...TRADING_STATE_COMMANDS,
		...TRADING_CONFIGS_CALLBACK_QUERIES,
		...TRADING_STATE_CALLBACK_QUERIES,
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

	private initializeCommands() {
		const commands = this.findProvidersByClass<IBotCommand>(IBotCommand);
		this.telegramService.setCommands(commands);
	}

	private initializeCallbackQueries() {
		const callbackQueries =
			this.findProvidersByClass<IBotCallbackQuery>(IBotCallbackQuery);
		this.telegramService.useCallbackQueries(callbackQueries);
	}

	private findProvidersByClass<T>(abstractClass: Function): T[] {
		return this.discoveryService
			.getProviders()
			.map((wrapper) => wrapper.instance)
			.filter(
				(instance): instance is T => instance instanceof abstractClass,
			);
	}
}
