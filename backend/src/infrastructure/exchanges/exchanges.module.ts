import { Module } from '@nestjs/common';
import { ExchangeCredentialsModule } from './exchange-credentials/exchange-credentials.module';
import { BinanceModule } from './modules/binance/binance.module';
import { BybitModule } from './modules/bybit/bybit.module';

@Module({
	imports: [ExchangeCredentialsModule, BinanceModule, BybitModule],
	providers: [],
	exports: [ExchangeCredentialsModule, BinanceModule, BybitModule],
})
export class ExchangesModule {}
