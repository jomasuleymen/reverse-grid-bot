import { forwardRef, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangesModule } from '../exchanges/exchanges.module';
import { TelegramModule } from '../services/telegram/telegram.module';
import { TRADING_BOTS } from './bots';
import { TradingConfigurationsModule } from './configurations/trading-configs.module';
import { TradingBotConfigsService } from './configurations/trading-configs.service';
import { TradingBotOrdersEntity } from './entities/trading-bot-orders.entity';
import { TradingBotEntity } from './entities/trading-bots.entity';
import { TradingBotOrdersService } from './trading-bot-orders.service';
import { TradingBotsController } from './trading-bots.controller';
import { TradingBotService } from './trading-bots.service';

const PROVIDERS: Provider[] = [
	TradingBotService,
	TradingBotConfigsService,
	TradingBotOrdersService,
];

@Module({
	imports: [
		TradingConfigurationsModule,
		ExchangesModule,
		TypeOrmModule.forFeature([TradingBotEntity, TradingBotOrdersEntity]),
		forwardRef(() => TelegramModule),
	],
	controllers: [TradingBotsController],
	providers: [...TRADING_BOTS, ...PROVIDERS],
	exports: [...PROVIDERS],
})
export class TradingBotModule {}
