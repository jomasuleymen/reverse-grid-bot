import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { getConfigModuleOptions } from './infrastructure/configs/config-options';
import { ExchangesModule } from './infrastructure/exchanges/exchanges.module';
import { CustomLoggerModule } from './infrastructure/services/logger/logger.module';
import { TelegramModule } from './infrastructure/services/telegram/telegram.module';
import { PresentationModule } from './presentation/presentation.module';
import { TradingBotsModules } from './infrastructure/trading-bots/trade-bots.module';

@Module({
	imports: [
		ConfigModule.forRoot(getConfigModuleOptions()),
		ScheduleModule.forRoot(),
		PresentationModule,
		ExchangesModule,
		TradingBotsModules,

		TelegramModule,
		CustomLoggerModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
