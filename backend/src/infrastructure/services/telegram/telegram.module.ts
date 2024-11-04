import { MyContext } from '@/domain/adapters/telegram.interface';
import { NotificationModule } from '@/infrastructure/notification/notification.module';
import { TradingBotModule } from '@/infrastructure/trading-bots/trading-bots.module';
import {
	forwardRef,
	Module,
	OnModuleDestroy,
	OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot, TelegrafModule } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { TelegramService } from './telegram.service';
import { TradingBotUpdate } from './trading-bot/telegram-bot.update';

@Module({
	imports: [
		forwardRef(() => TradingBotModule),
		NotificationModule,
		TelegrafModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				token: configService.getOrThrow<string>('telegram.bot.token'),
				launchOptions: {
					dropPendingUpdates: true,
				},
			}),
		}),
	],
	providers: [TelegramService, TradingBotUpdate],
	exports: [TelegramService],
})
export class TelegramModule implements OnModuleDestroy, OnModuleInit {
	constructor(
		@InjectBot() private bot: Telegraf<MyContext>,
		private readonly telegramService: TelegramService,
	) {}

	onModuleInit() {
		this.telegramService.updateBotCommands();
	}

	onModuleDestroy() {
		this.bot?.stop?.();
	}
}
