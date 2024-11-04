import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingBotConfigEntity } from './entities/trading-config.entity';
import { TradingBotConfigsService } from './trading-configs.service';

@Module({
	imports: [TypeOrmModule.forFeature([TradingBotConfigEntity])],
	controllers: [],
	providers: [TradingBotConfigsService],
	exports: [TradingBotConfigsService],
})
export class TradingConfigurationsModule {}
