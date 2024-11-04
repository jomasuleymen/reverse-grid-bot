import { forwardRef, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangesModule } from '../exchanges/exchanges.module';
import { TelegramModule } from '../services/telegram/telegram.module';
import { TRADING_BOTS } from './bots';
import { TradingBotConfigEntity } from './configurations/entities/trading-config.entity';
import { TradingConfigurationsModule } from './configurations/trading-configs.module';
import { TradingBotConfigsService } from './configurations/trading-configs.service';
import { TradingBotService } from './trading-bots.service';

const PROVIDERS: Provider[] = [TradingBotService, TradingBotConfigsService];

@Module({
	imports: [
		ExchangesModule,
		TypeOrmModule.forFeature([TradingBotConfigEntity]),
		TradingConfigurationsModule,
		forwardRef(() => TelegramModule),
	],
	controllers: [],
	providers: [...TRADING_BOTS, ...PROVIDERS],
	exports: [...PROVIDERS],
})
export class TradingBotModule {}
