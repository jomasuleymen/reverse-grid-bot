import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import session, { MemoryStore } from 'express-session';
import passport from 'passport';
import { WEEK } from 'time-constants';
import { getConfigModuleOptions } from './configs/config-service';
import { ExchangesModule } from './infrastructure/exchanges/exchanges.module';
import { TradingBotModule } from './infrastructure/trading-bots/trading-bots.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { CustomLoggerModule } from './infrastructure/services/logger/logger.module';
import { TelegramModule } from './infrastructure/services/telegram/telegram.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmModuleOptions } from './configs/typeorm';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [],
			inject: [],
			useFactory: getTypeOrmModuleOptions,
		}),
		ConfigModule.forRoot(getConfigModuleOptions()),
		ScheduleModule.forRoot(),

		AuthModule,

		ExchangesModule,
		TradingBotModule,

		CustomLoggerModule,

		TelegramModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule implements NestModule {
	constructor(private readonly config: ConfigService) {}

	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(
				session({
					store: new MemoryStore(),
					saveUninitialized: true,
					secret: this.config.get<string>('session.secret', 'secret'),
					resave: false,
					cookie: {
						sameSite: false,
						secure: false,
						httpOnly: false,
						maxAge: WEEK,
					},
				}),
				passport.initialize(),
				passport.session(),
			)
			.forRoutes('*');
	}
}
