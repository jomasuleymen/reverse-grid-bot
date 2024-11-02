import { TradingBotAccountType } from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TradingBotConfigEntity } from '../entities/trading/trading-config.entity';
import LoggerService from '../services/logger/logger.service';
import { BybitSpotReverseGridBot } from './bybit/spot-reverse-grid-bot';

@Injectable()
export class TradingBotsService {
	constructor(
		private readonly configService: ConfigService,
		private readonly loggerService: LoggerService,
	) {}

	public async getBot(config: TradingBotConfigEntity) {
		const bot = new BybitSpotReverseGridBot(
			{
				credentials: {
					apiKey: this.configService.getOrThrow('bybit.api.key'),
					apiSecret:
						this.configService.getOrThrow('bybit.api.secret'),
				},
				config: {
					...config,
					isTestnet:
						config.accountMode === TradingBotAccountType.Testnet,
				},
			},
			this.loggerService,
		);

		return bot;
	}
}
