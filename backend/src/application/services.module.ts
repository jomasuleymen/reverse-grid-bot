import { RepositoriesModule } from '@/infrastructure/repositories/repositories.module';
import { TradingBotsModules } from '@/infrastructure/modules/trading-bots/trading-bots.module';
import { Module } from '@nestjs/common';
import { TradingBotsApplicationService } from './services/trading-bots.service';

const SERVICES = [TradingBotsApplicationService];

@Module({
	imports: [RepositoriesModule, TradingBotsModules],
	providers: [...SERVICES],
	exports: [...SERVICES],
})
export class ServicesModule {}
