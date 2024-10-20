import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConfigModuleOptions } from './infrastructure/configs/config-options';
import { ExchangesModule } from './infrastructure/exchanges/exchanges.module';
import { BackgroundModule } from './presentation/background/background.module';

@Module({
	imports: [
		ConfigModule.forRoot(getConfigModuleOptions()),
		BackgroundModule,
		ExchangesModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
