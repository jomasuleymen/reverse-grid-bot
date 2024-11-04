import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramModule } from '../services/telegram/telegram.module';
import { BybitSpotReverseGridBot } from './bybit/spot-reverse-grid-bot';
import { BaseReverseGridBot } from './common/base-reverse-grid-bot';
import { TradingTelegramUpdate } from './controllers/telegram/telegram-bot.controller';
import { ExchangeCredentialsEntity } from './entities/exchang-credentials.entity';
import { TradingBotConfigEntity } from './entities/trading-config.entity';
import { ExchangeCredentialsService } from './exchange-credentials.service';
import { TradingBotConfigsService } from './trading-bot-configs.service';
import { TradingBotService } from './trading-bots.service';

const bots: Provider[] = [BaseReverseGridBot as any, BybitSpotReverseGridBot];
const providers: Provider[] = [
	TradingBotService,
	ExchangeCredentialsService,
	TradingBotConfigsService,
	TradingTelegramUpdate,
];

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ExchangeCredentialsEntity,
			TradingBotConfigEntity,
		]),
		TelegramModule,
	],
	controllers: [],
	providers: [...bots, ...providers],
	exports: [...providers],
})
export class TradingBotsModules {}
