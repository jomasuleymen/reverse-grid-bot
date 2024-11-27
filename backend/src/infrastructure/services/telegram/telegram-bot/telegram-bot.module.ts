import {
	IBotCallbackQuery,
	IBotCommand,
} from '@/domain/adapters/telegram.interface';
import { NotificationModule } from '@/infrastructure/notification/notification.module';
import { UserModule } from '@/infrastructure/user/user.module';
import { Module, OnModuleInit, Provider } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import { CONNECT_TO_ACCOUNT_COMMANDS } from './commands/trading-bot/connect.command';
import { TelegramBotService } from './telegram-bot.service';

const COMMANDS: Provider[] = [...CONNECT_TO_ACCOUNT_COMMANDS];

@Module({
	imports: [DiscoveryModule, UserModule, NotificationModule],
	providers: [...COMMANDS, TelegramBotService],
	exports: [TelegramBotService],
})
export class TelegramBotModule implements OnModuleInit {
	constructor(
		private readonly telegramService: TelegramBotService,
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
