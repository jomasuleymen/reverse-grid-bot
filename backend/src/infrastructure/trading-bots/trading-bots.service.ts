import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BybitSpotReverseGridBot } from './bybit/spot-reverse-grid-bot';

@Injectable()
export class TradingBotsService {
	constructor(private moduleRef: ModuleRef) {}

	public async getBot(exchange: ExchangeEnum) {
		switch (exchange) {
			case ExchangeEnum.Bybit:
				return await this.moduleRef.resolve(BybitSpotReverseGridBot);
		}

		throw new Error('Биржа не поддерживается');
	}
}
