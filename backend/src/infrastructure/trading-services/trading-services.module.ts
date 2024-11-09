import { DATABASES } from '@/configs/typeorm';
import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangesModule } from '../exchanges/exchanges.module';
import { BullServiceModule } from '../services/bull/bull.module';
import { KlineEntity } from './entities/kline.service-entity';
import { ReverseGridBotConfigEntity } from './entities/reverse-grid-bot-configs.service-entity';
import { ReverseGridBotStatsEntity } from './entities/reverse-grid-bot-stats.service-entity';
import { KlineService } from './services/kline-service.service';
import { SimulateReverseGridBotService } from './services/simulate-reverse-grid-bot.service';
import { TradingServicesController } from './trading-services.controller';
import { TradingServicesService } from './trading-services.service';

const PROVIDERS: Provider[] = [
	KlineService,
	SimulateReverseGridBotService,
	TradingServicesService,
];

@Module({
	imports: [
		BullServiceModule,
		ExchangesModule,
		TypeOrmModule.forFeature(
			[
				KlineEntity,
				ReverseGridBotStatsEntity,
				ReverseGridBotConfigEntity,
			],
			DATABASES.SERVICE_DB,
		),
	],
	controllers: [TradingServicesController],
	providers: [...PROVIDERS],
	exports: [...PROVIDERS, TypeOrmModule],
})
export class TradingServicesModule {}
