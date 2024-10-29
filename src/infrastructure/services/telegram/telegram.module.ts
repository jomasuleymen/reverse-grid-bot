import { MyContext } from '@/domain/adapters/telegram.interface';
import { RepositoriesModule } from '@/infrastructure/repositories/repositories.module';
import { Module, OnModuleInit } from '@nestjs/common';
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
			}),
		}),
	],
	providers: [TelegramService],
	exports: [TelegramService],
})
export class TelegramModule implements OnModuleInit {
	constructor(@InjectBot() private bot: Telegraf<MyContext>) {}

	onModuleInit() {
		process.once('SIGINT', () => this.bot.stop('SIGINT'));
		process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
	}
}
