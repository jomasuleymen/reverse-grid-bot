import { RedisModule } from '@liaoliaots/nestjs-redis';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import session from 'express-session';
import passport from 'passport';
import { BackgroundModule } from './background/backgroud.module';
import { getConfigModuleOptions } from './configs/config-service';
import { getRedisOptions } from './configs/redis';
import { getTypeOrmModuleOptions } from './configs/typeorm';
import { AuthModule } from './infrastructure/auth/auth.module';
import { ExchangesModule } from './infrastructure/exchanges/exchanges.module';
import { BullServiceModule } from './infrastructure/services/bull/bull.module';
import { CustomLoggerModule } from './infrastructure/services/logger/logger.module';
import { TelegramModule } from './infrastructure/services/telegram/telegram.module';
import { SessionModule } from './infrastructure/session/session.module';
import { SessionService } from './infrastructure/session/session.service';
import { TradingBotModule } from './infrastructure/trading-bots/trading-bots.module';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [],
			inject: [],
			useFactory: getTypeOrmModuleOptions,
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
		SessionModule,
		BullServiceModule,
		
		AuthModule,
		
		ExchangesModule,
		TradingBotModule,
		
		CustomLoggerModule,
		
		TelegramModule,
		BackgroundModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule implements NestModule {
	constructor(private readonly sessionService: SessionService) {}

	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(
				session(this.sessionService.getSessionOptions()),
				passport.initialize(),
				passport.session(),
			)
			.forRoutes('*');
	}
}
