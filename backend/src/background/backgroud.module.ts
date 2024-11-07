import { ExchangesModule } from '@/infrastructure/exchanges/exchanges.module';
import { TradingBotModule } from '@/infrastructure/trading-bots/trading-bots.module';
import { Module } from '@nestjs/common';
import { TradingBotStartConsumer } from './trading-bots/trading-bot-start.processor';
import { TradingBotStopConsumer } from './trading-bots/trading-bot-stop.processor';
import { BullServiceModule } from '@/infrastructure/services/bull/bull.module';
import { TelegramModule } from '@/infrastructure/services/telegram/telegram.module';

@Module({
	imports: [
		TelegramModule,
		BullServiceModule,
		TradingBotModule,
		ExchangesModule,
	],
	providers: [TradingBotStartConsumer, TradingBotStopConsumer],
})
export class BackgroundModule {}
