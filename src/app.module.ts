import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { getConfigModuleOptions } from './infrastructure/configs/config-service';
import { ExchangesModule } from './infrastructure/exchanges/exchanges.module';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';
import { CustomLoggerModule } from './infrastructure/services/logger/logger.module';
import { TelegramModule } from './infrastructure/services/telegram/telegram.module';
import { TradingBotsModules } from './infrastructure/trading-bots/trading-bots.module';
import { PresentationModule } from './presentation/presentation.module';

@Module({
	imports: [
		ConfigModule.forRoot(getConfigModuleOptions()),
		ScheduleModule.forRoot(),

		PresentationModule,

		ExchangesModule,
		TradingBotsModules,

		CustomLoggerModule,
		RepositoriesModule,

		TelegramModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
