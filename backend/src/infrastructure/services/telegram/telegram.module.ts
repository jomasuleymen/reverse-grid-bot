import {
	IBotCallbackQuery,
	IBotCommand,
} from '@/domain/adapters/telegram.interface';
import { NotificationModule } from '@/infrastructure/notification/notification.module';
import { UserModule } from '@/infrastructure/user/user.module';
import { Global, Module, OnModuleInit, Provider } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import { CONNECT_TO_ACCOUNT_COMMANDS } from './commands/trading-bot/connect.command';
import { TelegramService } from './telegram.service';

const COMMANDS: Provider[] = [...CONNECT_TO_ACCOUNT_COMMANDS];

@Global()
@Module({
	imports: [DiscoveryModule, UserModule, NotificationModule],
	providers: [...COMMANDS, TelegramService],
	exports: [TelegramService],
})
export class TelegramModule implements OnModuleInit {
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
