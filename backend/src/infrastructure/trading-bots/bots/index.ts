import { Provider } from '@nestjs/common';
import { BinanceSpotReverseGridBot } from './binance/spot-reverse-grid-bot';
import { BybitSpotReverseGridBot } from './bybit/spot-reverse-grid-bot';

export const TRADING_BOTS: Provider[] = [
	BybitSpotReverseGridBot,
	BinanceSpotReverseGridBot,
];
