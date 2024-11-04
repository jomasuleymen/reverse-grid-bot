import { forwardRef, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramModule } from '../services/telegram/telegram.module';
import { BybitSpotReverseGridBot } from './bybit/spot-reverse-grid-bot';
import { BaseReverseGridBot } from './common/base-reverse-grid-bot';
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
];

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ExchangeCredentialsEntity,
			TradingBotConfigEntity,
		]),
		forwardRef(() => TelegramModule),
	],
	controllers: [],
	providers: [...bots, ...providers],
	exports: [...providers],
})
export class TradingBotModule {}
