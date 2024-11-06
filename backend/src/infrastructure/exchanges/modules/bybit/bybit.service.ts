import { Injectable } from '@nestjs/common';
import { CategoryV5, RestClientV5, WebsocketClient } from 'bybit-api';

@Injectable()
export class BybitService {
	private restClient: RestClientV5;

	private wsClient: WebsocketClient;
	private publicWsClient: WebsocketClient;

	constructor() {
		this.restClient = new RestClientV5({
			parseAPIRateLimits: true,
			recv_window: 10_000,
		});
	}

	public async getTickerLastPrice(
		category: 'spot' | CategoryV5,
		ticker: string,
	): Promise<number> {
		const coinPriceRes = await this.restClient.getTickers({
			category: category as any,
			symbol: ticker,
		});

		const foundTicker = coinPriceRes.result.list.find(
			(value) => value.symbol === ticker,
		);

		if (!foundTicker) {
			throw new Error(`Тикер ${ticker} не найден`);
		}
		return Number(foundTicker.lastPrice);
	}
}
