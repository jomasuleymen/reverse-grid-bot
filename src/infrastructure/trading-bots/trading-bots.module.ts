import { Module, Provider } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { TradingBotsService } from './trading-bots.service';
import { TradingUtils } from './utils/trading.util';

const providers: Provider[] = [TradingUtils, TradingBotsService];

@Module({
	imports: [RepositoriesModule],
	providers: [...providers],
	exports: [...providers],
})
export class TradingBotsModules {}
