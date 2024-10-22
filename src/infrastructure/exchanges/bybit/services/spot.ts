import { TelegramService } from '@/infrastructure/services/telegram/telegram.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RestClientV5, WebsocketClient } from 'bybit-api';

@Injectable()
export class BybitSpotService {
	private readonly apiKey: string;
	private readonly apiSecret: string;
	private readonly isTestMode: boolean;
	private readonly restClient: RestClientV5;
	private readonly wsClient: WebsocketClient;

	private readonly tradeConfig = {
		diff: 20,
		maxPrice: 0,
		minPrice: 100_000_000,
	};

	constructor(
		private readonly configService: ConfigService,
		private readonly telegramService: TelegramService,
	) {
		this.apiKey = this.configService.getOrThrow('bybit.api.key');
		this.apiSecret = this.configService.getOrThrow('bybit.api.secret');

		if (!this.apiKey || !this.apiSecret) {
			throw new Error('Bybit credentials not provided');
		}

		this.isTestMode =
			this.configService.getOrThrow('environment') !== 'production';

		this.restClient = new RestClientV5({
			key: this.apiKey,
			secret: this.apiSecret,
			demoTrading: this.isTestMode,
			parseAPIRateLimits: false,
			recv_window: 30_000,
		});

		this.wsClient = new WebsocketClient({
			key: this.apiKey,
			secret: this.apiSecret,
			market: 'v5',
			demoTrading: this.isTestMode,
		});

		this.wsClient.subscribeV5('order', 'spot');

		this.configureWsEmits(this.wsClient);

		this.init();
	}

	private configureWsEmits(ws: WebsocketClient) {
		ws.on('update', (data) => {
			if (!data) return;

			console.log('update', data.data);

			if (data.topic === 'order') {
				if (data.data)
					for (let order of data.data) {
						if (order.orderStatus === 'Filled') {
							let [idPrefix, price, timestamp] = (
								order.orderLinkId || ''
							).split('_');

							if (price) price = Number(price);
							else price = Number(order.avgPrice);

							if (
								price <= this.tradeConfig.minPrice ||
								order.side === 'Buy'
							) {
								this.restClient
									.submitOrder({
										category: 'spot',
										symbol: 'BTCUSDT',
										side: 'Sell',
										orderType: 'Market',
										qty: order.cumExecQty,
										marketUnit: 'baseCoin',
										price: (
											price - this.tradeConfig.diff
										).toString(),
										timeInForce: 'GTC',
										orderLinkId: `order_${price - this.tradeConfig.diff}_${Date.now()}`,
										orderFilter: 'StopOrder',
										triggerPrice: (
											price - this.tradeConfig.diff
										).toString(),
									})
									.then((response) => {
										console.log(response);
									})
									.catch((error) => {
										console.error(error);
									});

								this.tradeConfig.minPrice = Math.min(
									this.tradeConfig.minPrice,
									price - this.tradeConfig.diff,
								);
							}

							if (
								price >= this.tradeConfig.maxPrice ||
								order.side === 'Sell'
							) {
								this.restClient
									.submitOrder({
										category: 'spot',
										symbol: 'BTCUSDT',
										side: 'Buy',
										orderType: 'Market',
										qty: order.cumExecQty,
										marketUnit: 'baseCoin',
										price: (
											price + this.tradeConfig.diff
										).toString(),
										timeInForce: 'GTC',
										orderLinkId: `order_${price + this.tradeConfig.diff}_${Date.now()}`,
										orderFilter: 'StopOrder',
										triggerPrice: (
											price + this.tradeConfig.diff
										).toString(),
									})
									.then((response) => {
										console.log(response);
									})
									.catch((error) => {
										console.error(error);
									});

								this.tradeConfig.maxPrice = Math.max(
									this.tradeConfig.maxPrice,
									price + this.tradeConfig.diff,
								);
							}

							this.telegramService.sendMessage(
								`BYBIT
								side: ${order.side}
								status: ${order.orderStatus}
								linkedPrice: ${price},
								avgPrice: ${order.avgPrice}
								orderType: ${order.orderType}`,
							);
						} else if (order.orderStatus !== 'Untriggered') {
							this.telegramService.sendMessage(`order: ${order}`);
						}
					}
			}
		});

		ws.on('open', (data) => {
			console.log('WS OPENED');
		});

		ws.on('reconnect', (data) => {
			console.log('ws automatically reconnecting.... ', data?.wsKey);
		});

		ws.on('reconnected', (data) => {
			console.log('ws has reconnected ', data?.wsKey);
		});
	}

	private async init() {
		// await this.createNewOrder();
		// await this.createNewLimitOrder();
		// await this.createNewStopOrder();
		// await this.createNewTpSlOrder();

		this.restClient
			.getTickers({ category: 'spot', symbol: 'BTCUSDT' })
			.then(async (res) => {
				const startPrice = Number(res.result.list[0]?.lastPrice);

				console.log('START PRICE: ', startPrice);

				for (let i = 1; i < 2; i++) {
					const price = startPrice + this.tradeConfig.diff * i;
					await this.restClient
						.submitOrder({
							category: 'spot',
							symbol: 'BTCUSDT',
							side: 'Buy',
							orderType: 'Market',
							qty: '0.01',
							marketUnit: 'baseCoin',
							price: price.toString(),
							timeInForce: 'GTC',
							orderLinkId: `order_${price}_${Date.now()}`,
							orderFilter: 'StopOrder',
							triggerPrice: price.toString(),
						})
						.then((response) => {
							console.log(response);
						})
						.catch((error) => {
							console.error(error);
						});

					this.tradeConfig.maxPrice = Math.max(
						this.tradeConfig.maxPrice,
						price,
					);
				}
				for (let i = 1; i < 2; i++) {
					const price = startPrice - this.tradeConfig.diff * i;

					await this.restClient
						.submitOrder({
							category: 'spot',
							symbol: 'BTCUSDT',
							side: 'Buy',
							orderType: 'Market',
							qty: '0.01',
							marketUnit: 'baseCoin',
							price: price.toString(),
							timeInForce: 'GTC',
							orderLinkId: `order_${price}_${Date.now()}`,
							orderFilter: 'StopOrder',
							triggerPrice: price.toString(),
						})
						.then((response) => {
							console.log(response);
						})
						.catch((error) => {
							console.error(error);
						});

					this.tradeConfig.minPrice = Math.min(
						this.tradeConfig.minPrice,
						price,
					);
				}
			});
	}

	private async createNewOrder() {
		this.restClient
			.submitOrder({
				category: 'spot',
				symbol: 'BTCUSDT',
				side: 'Buy',
				orderType: 'Market',
				qty: '0.001',
				marketUnit: 'baseCoin',
				// price: '15600',
				timeInForce: 'GTC',
				// orderLinkId: 'spot-test-gtc-joma ' + Date.now(),
				isLeverage: 0,
				orderFilter: 'Order',
			})
			.then((response) => {
				console.log(response);
			})
			.catch((error) => {
				console.error(error);
			});
	}
	private async createNewLimitOrder() {
		this.restClient
			.submitOrder({
				category: 'spot',
				symbol: 'BTCUSDT',
				side: 'Buy',
				orderType: 'Limit',
				qty: '0.001',
				marketUnit: 'baseCoin',
				price: '67500',
				timeInForce: 'GTC',
				// orderLinkId: 'spot-test-gtc-joma ' + Date.now(),
				orderFilter: 'Order',

				slOrderType: 'Limit',
				stopLoss: '63000',
				slLimitPrice: '63000',
			})
			.then((response) => {
				console.log(response);
			})
			.catch((error) => {
				console.error(error);
			});
	}

	private async createNewStopOrder() {
		this.restClient
			.submitOrder({
				category: 'spot',
				symbol: 'BTCUSDT',
				side: 'Buy',
				orderType: 'Limit',
				qty: '0.001',
				marketUnit: 'baseCoin',
				price: '67670',
				timeInForce: 'GTC',
				orderLinkId: Date.now().toString(),
				orderFilter: 'StopOrder',
				triggerPrice: '67580',
			})
			.then((response) => {
				console.log(response);
			})
			.catch((error) => {
				console.error(error);
			});
	}

	private async createNewTpSlOrder() {
		this.restClient
			.submitOrder({
				category: 'spot',
				symbol: 'BTCUSDT',
				side: 'Buy',
				orderType: 'Limit',
				qty: '0.001',
				marketUnit: 'baseCoin',
				price: '67670',
				timeInForce: 'PostOnly',
				orderLinkId: Date.now().toString(),
				orderFilter: 'StopOrder',
				triggerPrice: '67580',
			})
			.then((response) => {
				console.log(response);
			})
			.catch((error) => {
				console.error(error);
			});
	}

	private async getWalletBalance() {
		// this.restClient
		// 	.getWalletBalance({ accountType: 'UNIFIED' })
		// 	.then((result) => {
		// 		console.log(
		// 			'getAccountInfo result: ',
		// 			JSON.stringify(result, null, 2),
		// 		);
		// 	})
		// 	.catch((err) => {
		// 		console.error('getAccountInfo error: ', err);
		// 	});
	}
}
