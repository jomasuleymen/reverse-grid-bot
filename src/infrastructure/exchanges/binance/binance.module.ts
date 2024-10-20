import { Module } from '@nestjs/common';
import { BinanceFuturesService } from './services/futures';

@Module({
	imports: [],
	providers: [BinanceFuturesService],
	exports: [BinanceFuturesService],
})
export class BinanceModule {}
