import { DATABASES } from '@/configs/typeorm';
import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangesModule } from '../exchanges/exchanges.module';
import { BullServiceModule } from '../services/bull/bull.module';
import { KlineEntity } from './entities/kline.service-entity';
import { TradingBotSimulatorOrderEntity } from './entities/trading-bot-simulator-orders.service-entity';
import { TradingBotSimulatorStatsEntity } from './entities/trading-bot-simulator-stats.service-entity';
import { TradingBotSimulatorEntity } from './entities/trading-bot-simulator.service-entity';
import { KlineService } from './services/kline-service.service';
import { SimulateReverseGridBotService } from './services/simulate-reverse-grid-bot.service';
import { BotSimulatorOrdersService } from './services/simulator-orders.service';
import { TradingServicesController } from './trading-services.controller';
import { TradingServicesService } from './trading-services.service';

const PROVIDERS: Provider[] = [
	TradingServicesService,
	KlineService,
	SimulateReverseGridBotService,
	BotSimulatorOrdersService,
];

@Module({
	imports: [
		BullServiceModule,
		ExchangesModule,
		TypeOrmModule.forFeature(
			[
				KlineEntity,
				TradingBotSimulatorEntity,
				TradingBotSimulatorStatsEntity,
				TradingBotSimulatorOrderEntity,
			],
			DATABASES.SERVICE_DB,
		),
	],
	controllers: [TradingServicesController],
	providers: [...PROVIDERS],
	exports: [...PROVIDERS, TypeOrmModule],
})
export class TradingServicesModule {}
