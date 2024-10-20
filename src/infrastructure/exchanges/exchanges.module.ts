import { Module } from '@nestjs/common';
import { BinanceModule } from './binance/binance.module';

@Module({
	imports: [BinanceModule],
	controllers: [],
	providers: [],
})
export class ExchangesModule {}
