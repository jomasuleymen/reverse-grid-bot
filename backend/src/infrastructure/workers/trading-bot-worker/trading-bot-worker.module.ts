import { getConfigModuleOptions } from '@/configs/config-service';
import { getRedisOptions } from '@/configs/redis';
import { getMainOrmOptions } from '@/configs/typeorm';
import { ExchangesModule } from '@/infrastructure/exchanges/exchanges.module';
import { CustomLoggerModule } from '@/infrastructure/services/logger/logger.module';
import { TelegramModule } from '@/infrastructure/services/telegram/telegram.module';
import { TradingBotModule } from '@/infrastructure/trading-bots/trading-bots.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingBotWorkerService } from './trading-bot-worker.service';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [],
			inject: [],
			useFactory: getMainOrmOptions,
		}),
		ConfigModule.forRoot(getConfigModuleOptions()),
		ScheduleModule.forRoot(),
		RedisModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: any) => ({
				config: {
					...getRedisOptions(config),
				},
			}),
		}),

		ExchangesModule,
		TradingBotModule,

		CustomLoggerModule,

		TelegramModule,
	],
	providers: [TradingBotWorkerService],
	exports: [TradingBotWorkerService],
})
export class TradingBotWorkerModule {}
