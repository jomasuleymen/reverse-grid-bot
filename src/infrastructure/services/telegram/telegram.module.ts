import { MyContext } from '@/domain/adapters/telegram.interface';
import { RepositoriesModule } from '@/infrastructure/repositories/repositories.module';
import { Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot, TelegrafModule } from 'nestjs-telegraf';
import { session, Telegraf } from 'telegraf';
import { TelegramService } from './telegram.service';

@Module({
	imports: [
		RepositoriesModule,
		TelegrafModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				token: configService.getOrThrow<string>('telegram.bot.token'),
				middlewares: [session()],
				launchOptions: {
					dropPendingUpdates: true,
				},
			}),
		}),
	],
	providers: [TelegramService],
	exports: [TelegramService],
})
export class TelegramModule implements OnModuleDestroy {
	constructor(@InjectBot() private bot: Telegraf<MyContext>) {}

	onModuleDestroy() {
		this.bot.stop();
	}
}
