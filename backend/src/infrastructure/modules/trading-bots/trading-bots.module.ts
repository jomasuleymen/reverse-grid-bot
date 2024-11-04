import { Module, Provider } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { TelegramModule } from '../../services/telegram/telegram.module';
import { BybitSpotReverseGridBot } from './bybit/spot-reverse-grid-bot';
import { BaseReverseGridBot } from './common/base-reverse-grid-bot';
import { TradingBotsService } from './trading-bots.service';
import { TradingUtils } from './utils/trading.util';

const bots: Provider[] = [BaseReverseGridBot as any, BybitSpotReverseGridBot];
const providers: Provider[] = [TradingUtils, TradingBotsService];

@Module({
	imports: [TelegramModule, RepositoriesModule],
	providers: [...bots, ...providers],
	exports: [...providers],
})
export class TradingBotsModules {}
