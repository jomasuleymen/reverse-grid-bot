import { Module, Provider } from '@nestjs/common';
import { BinanceFuturesReverseGridBot } from './binance/futures-reverse-grid-bot';
import { BybitSpotReverseGridBot } from './bybit/spot-reverse-grid-bot';
import { TradingUtils } from './utils/trading.util';
import { RepositoriesModule } from '../repositories/repositories.module';

const botProviders: Provider[] = [
	BybitSpotReverseGridBot,
	BinanceFuturesReverseGridBot,
];

@Module({
	imports: [RepositoriesModule],
	providers: [...botProviders, TradingUtils],
	exports: [...botProviders, TradingUtils],
})
export class TradingBotsModules {}
