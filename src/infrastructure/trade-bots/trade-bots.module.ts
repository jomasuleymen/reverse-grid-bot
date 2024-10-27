import { Module, Provider } from '@nestjs/common';
import { BinanceFuturesReverseGridBot } from './binance/futures-reverse-grid-bot';
import { BybitSpotReverseGridBot } from './bybit/spot-reverse-grid-bot';

const botProviders: Provider[] = [
	BybitSpotReverseGridBot,
	BinanceFuturesReverseGridBot,
];

@Module({
	imports: [],
	providers: [...botProviders],
	exports: [...botProviders],
})
export class TradeBotsModules {}
