import { forwardRef, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangesModule } from '../exchanges/exchanges.module';
import { TelegramModule } from '../services/telegram/telegram.module';
import { TRADING_BOTS } from './bots';
import { TradingConfigurationsModule } from './configurations/trading-configs.module';
import { TradingBotConfigsService } from './configurations/trading-configs.service';
import { TradingBotEntity } from './entities/trading-bots.entity';
import { TradingBotsController } from './trading-bots.controller';
import { TradingBotService } from './trading-bots.service';

const PROVIDERS: Provider[] = [TradingBotService, TradingBotConfigsService];

@Module({
	imports: [
		ExchangesModule,
		TypeOrmModule.forFeature([TradingBotEntity]),
		TradingConfigurationsModule,
		forwardRef(() => TelegramModule),
	],
	controllers: [TradingBotsController],
	providers: [...TRADING_BOTS, ...PROVIDERS],
	exports: [...PROVIDERS],
})
export class TradingBotModule {}
