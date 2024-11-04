import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import session, { MemoryStore } from 'express-session';
import passport from 'passport';
import { WEEK } from 'time-constants';
import { getConfigModuleOptions } from './infrastructure/configs/config-service';
import { ExchangesModule } from './infrastructure/modules/exchanges/exchanges.module';
import { TradingBotsModules } from './infrastructure/modules/trading-bots/trading-bots.module';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';
import { AuthModule } from './infrastructure/services/auth/auth.module';
import { CustomLoggerModule } from './infrastructure/services/logger/logger.module';
import { TelegramModule } from './infrastructure/services/telegram/telegram.module';
import { PresentationModule } from './presentation/presentation.module';

@Module({
	imports: [
		ConfigModule.forRoot(getConfigModuleOptions()),
		ScheduleModule.forRoot(),

		AuthModule,
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
