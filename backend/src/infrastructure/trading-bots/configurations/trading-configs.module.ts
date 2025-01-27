import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingBotConfigEntity } from './entities/trading-config.entity';
import { TradingBotConfigsController } from './trading-configs.controller';
import { TradingBotConfigsService } from './trading-configs.service';
import { ExchangesModule } from '@/infrastructure/exchanges/exchanges.module';

@Module({
	imports: [
		ExchangesModule,
		TypeOrmModule.forFeature([TradingBotConfigEntity]),
	],
	controllers: [TradingBotConfigsController],
	providers: [TradingBotConfigsService],
	exports: [TypeOrmModule, TradingBotConfigsService],
})
export class TradingConfigurationsModule {}
