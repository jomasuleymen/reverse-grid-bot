import { IBotCommand } from '@/domain/adapters/telegram.interface';
import { TelegramService } from '@/infrastructure/services/telegram/telegram.service';
import { Module, OnModuleInit } from '@nestjs/common';
import { StartTradingCommand } from './commands/start-trading';
import { StopTradingCommand } from './commands/stop-trading';

@Module({})
export class TelegramBotCommandsModule implements OnModuleInit {
	constructor(private readonly telegramService: TelegramService) {}

	async onModuleInit() {
		const commands: IBotCommand[] = [
			new StartTradingCommand(),
			new StopTradingCommand(),
		];
		await this.telegramService.setCommands(commands);
	}
}
