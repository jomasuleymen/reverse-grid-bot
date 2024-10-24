import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConfigModuleOptions } from './infrastructure/configs/config-options';
import { ExchangesModule } from './infrastructure/exchanges/exchanges.module';
import { BackgroundModule } from './presentation/background/background.module';
import { TelegramModule } from './infrastructure/services/telegram/telegram.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
	imports: [
		ConfigModule.forRoot(getConfigModuleOptions()),
		ScheduleModule.forRoot(),
		BackgroundModule,
		ExchangesModule,

		TelegramModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
