import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AllExceptionsFilter } from './infrastructure/common/filters/all-exception.filter';
import { getConfigModuleOptions } from './infrastructure/configs/config-service';
import { ExchangesModule } from './infrastructure/exchanges/exchanges.module';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';
import { CustomLoggerModule } from './infrastructure/services/logger/logger.module';
import { TelegramModule } from './infrastructure/services/telegram/telegram.module';
import { TradingBotsModules } from './infrastructure/trading-bots/trade-bots.module';
import { PresentationModule } from './presentation/presentation.module';

@Module({
	imports: [
		ConfigModule.forRoot(getConfigModuleOptions()),
		ScheduleModule.forRoot(),

		PresentationModule,
		ExchangesModule,
		TradingBotsModules,

		TelegramModule,
		CustomLoggerModule,
		RepositoriesModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_FILTER,
			useClass: AllExceptionsFilter,
		},
	],
})
export class AppModule {}
