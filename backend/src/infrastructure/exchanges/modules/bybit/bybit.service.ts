import { WalletBalance } from '@/domain/interfaces/trading-bots/wallet.interface';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { Injectable } from '@nestjs/common';
import {
	CategoryV5,
	RestClientV5,
	WalletBalanceV5,
	WebsocketClient,
	WsTopic,
} from 'bybit-api';
import { SECOND } from 'time-constants';

@Injectable()
export class BybitService {
	private restClient: RestClientV5;
	private publicWsClient: WebsocketClient;
	private listeners: Record<string, Array<(...args: any[]) => void>>;

	constructor(protected readonly logger: LoggerService) {
		this.restClient = new RestClientV5({
			parseAPIRateLimits: true,
			recv_window: 15 * SECOND,
		});

		this.initializeWebsocket();
	}

	private initializeWebsocket() {
		this.publicWsClient = new WebsocketClient({
			market: 'v5',
		});
		this.listeners = {};

		this.publicWsClient.on('update', (data) => {
			if (!data?.topic) return;

			const listeners = this.listeners[data.topic];
			if (listeners?.length) {
				for (const listener of listeners) listener(data);
			}
		});

		this.publicWsClient.on('response', (data) => {
			this.logger.info('Public Bybit ws response', data);
		});

		this.publicWsClient.on('open', () => {
			this.logger.info('Public Bybit ws OPENED');
		});

		this.publicWsClient.on('reconnect', (data) => {
			this.logger.info('Public Bybit ws reconnecting.... ');
		});

		this.publicWsClient.on('reconnected', (data) => {
			this.logger.info('Public Bybit ws reconnected ');
		});
	}

	public subscribe(topic: WsTopic, listener: (...args: any[]) => void) {
		if (!this.listeners[topic]) {
			this.publicWsClient.subscribeV5(topic, 'spot');
			this.listeners[topic] = [];
		}

		this.listeners[topic].push(listener);
	}

	public unsubscribe(topic: WsTopic, listener: (...args: any[]) => void) {
		if (!this.listeners[topic]) return;

		const foundIndex = this.listeners[topic].findIndex(
			(l) => l === listener,
		);
		if (foundIndex !== -1) {
			this.listeners[topic].splice(foundIndex, 1);
		}

		if (this.listeners[topic].length === 0) {
			this.publicWsClient.unsubscribeV5(topic, 'spot');
			delete this.listeners[topic];
		}
	}

	public async getTickerLastPrice(
		category: 'spot' | CategoryV5,
		ticker: string,
	): Promise<number> {
		const coinPriceRes = await this.restClient.getTickers({
			category: category as any,
			symbol: ticker,
		});

		const foundTicker = coinPriceRes.result?.list?.find?.(
			(value) => value.symbol === ticker,
		);

		if (!foundTicker) {
			throw new Error(`Тикер ${ticker} не найден`);
		}
		return Number(foundTicker.lastPrice);
	}

	public formatWalletBalance(accountBalance: WalletBalanceV5): WalletBalance {
		return {
			accountType: accountBalance.accountType,
			coins: accountBalance.coin.map((coin: any) => ({
				coin: coin.coin,
				balance: Number(coin.walletBalance),
			})),
		};
	}
}
