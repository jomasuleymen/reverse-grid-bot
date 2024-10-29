import { RepositoriesModule } from '@/infrastructure/repositories/repositories.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';

@Module({
	imports: [
		RepositoriesModule,
		TelegrafModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				token: configService.getOrThrow<string>('telegram.bot.token'),
			}),
		}),
	],
	providers: [TelegramService],
	exports: [TelegramService],
})
export class TelegramModule {}
