import { ExchangesModule } from '@/infrastructure/exchanges/exchanges.module';
import { BullServiceModule } from '@/infrastructure/services/bull/bull.module';
import { TradingBotModule } from '@/infrastructure/trading-bots/trading-bots.module';
import { TradingServicesModule } from '@/infrastructure/trading-services/trading-services.module';
import { isInitTypeEnv, TYPE_ENV } from '@/init';
import { Module } from '@nestjs/common';
import { ReverseGridBotSimulateConsumer } from './simulators/reverse-grid-bit-simulate.processor';
import { TradingBotStartConsumer } from './trading-bots/trading-bot-start.processor';
import { TradingBotStopConsumer } from './trading-bots/trading-bot-stop.processor';

const IMPORT_PROVIDERS_BY_TYPE_ENV = () => {
	const schedules: any = [];
	const processes: any = [];

	if (isInitTypeEnv(TYPE_ENV.REVERSE_GRID_BOTS)) {
		processes.push(TradingBotStartConsumer, TradingBotStopConsumer);
	}
	if (isInitTypeEnv(TYPE_ENV.REVERSE_GRID_BOTS)) {
		processes.push(ReverseGridBotSimulateConsumer);
	}

	return [...processes, ...schedules];
};

@Module({
	imports: [
		BullServiceModule,
		TradingBotModule,
		ExchangesModule,
		TradingServicesModule,
	],
	providers: [...IMPORT_PROVIDERS_BY_TYPE_ENV()],
})
export class BackgroundModule {}
