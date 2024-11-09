import { ExchangesModule } from '@/infrastructure/exchanges/exchanges.module';
import { BullServiceModule } from '@/infrastructure/services/bull/bull.module';
import { TradingBotModule } from '@/infrastructure/trading-bots/trading-bots.module';
import { TradingServicesModule } from '@/infrastructure/trading-services/trading-services.module';
import { Module } from '@nestjs/common';
import { ReverseGridBotSimulateConsumer } from './trading-bots/reverse-grid-bit-simulate.processor';
import { TradingBotStartConsumer } from './trading-bots/trading-bot-start.processor';
import { TradingBotStopConsumer } from './trading-bots/trading-bot-stop.processor';

@Module({
	imports: [
		BullServiceModule,
		TradingBotModule,
		ExchangesModule,
		TradingServicesModule,
	],
	providers: [
		TradingBotStartConsumer,
		TradingBotStopConsumer,
		ReverseGridBotSimulateConsumer,
	],
})
export class BackgroundModule {}
