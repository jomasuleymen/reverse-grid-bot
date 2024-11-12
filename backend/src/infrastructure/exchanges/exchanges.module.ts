import { Module } from '@nestjs/common';
import { ExchangeCredentialsModule } from './exchange-credentials/exchange-credentials.module';
import { ExchangesService } from './exchanges.service';
import { BinanceModule } from './modules/binance/binance.module';
import { BybitModule } from './modules/bybit/bybit.module';

@Module({
	imports: [ExchangeCredentialsModule, BinanceModule, BybitModule],
	providers: [ExchangesService],
	exports: [
		ExchangeCredentialsModule,
		BinanceModule,
		BybitModule,
		ExchangesService,
	],
})
export class ExchangesModule {}
