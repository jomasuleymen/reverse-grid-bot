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
		diff: 50,
		maxPrice: 0,
		minPrice: 100_000_000,
	};

	constructor(
		private readonly configService: ConfigService,
		private readonly telegramService: TelegramService,
	) {
		this.apiKey = this.configService.getOrThrow('bybit.api.key');
		this.apiSecret = this.configService.getOrThrow('bybit.api.secret');
		this.tradeConfig.diff =
			Number(this.configService.get('bybit.spot.diff')) || 50;

		console.log(this.tradeConfig);

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
	}

	private configureWsEmits(ws: WebsocketClient) {
		ws.on('update', (data) => {
			if (!data) return;

			console.log('update', data.data);

			if (data.topic === 'order') {
				if (data.data)
					for (let order of data.data) {
						if (order.orderStatus === 'Filled') {
							let [idPrefix, triggerPrice, timestamp] = (
								order.orderLinkId || ''
							).split('_');

							if (triggerPrice)
								triggerPrice = Number(triggerPrice);
							else triggerPrice = Number(order.avgPrice);

							if (order.side === 'Buy') {
								this.restClient
									.submitOrder({
										category: 'spot',
										symbol: 'BTCUSDT',
										side: 'Sell',
										orderType: 'Market',
										qty: order.cumExecQty,
										marketUnit: 'baseCoin',
										price: (
											triggerPrice - this.tradeConfig.diff
										).toString(),
										timeInForce: 'GTC',
										orderLinkId: `sell_${triggerPrice - this.tradeConfig.diff}_${Date.now()}`,
										orderFilter: 'StopOrder',
										triggerPrice: (
											triggerPrice - this.tradeConfig.diff
										).toString(),
									})
									.then((response) => {
										console.log(response);
									})
									.catch((error) => {
										console.error(error);
									});
								if (triggerPrice >= this.tradeConfig.maxPrice) {
									this.restClient
										.submitOrder({
											category: 'spot',
											symbol: 'BTCUSDT',
											side: 'Buy',
											orderType: 'Market',
											qty: order.cumExecQty,
											marketUnit: 'baseCoin',
											price: (
												triggerPrice +
												this.tradeConfig.diff
											).toString(),
											timeInForce: 'GTC',
											orderLinkId: `buy2_${triggerPrice + this.tradeConfig.diff}_${Date.now()}`,
											orderFilter: 'StopOrder',
											triggerPrice: (
												triggerPrice +
												this.tradeConfig.diff
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
										triggerPrice + this.tradeConfig.diff,
									);
								}

								this.tradeConfig.minPrice = Math.min(
									this.tradeConfig.minPrice,
									triggerPrice - this.tradeConfig.diff,
								);
							} else if (order.side === 'Sell') {
								this.restClient
									.submitOrder({
										category: 'spot',
										symbol: 'BTCUSDT',
										side: 'Buy',
										orderType: 'Market',
										qty: order.cumExecQty,
										marketUnit: 'baseCoin',
										price: (
											triggerPrice + this.tradeConfig.diff
										).toString(),
										timeInForce: 'GTC',
										orderLinkId: `buy_${triggerPrice + this.tradeConfig.diff}_${Date.now()}`,
										orderFilter: 'StopOrder',
										triggerPrice: (
											triggerPrice + this.tradeConfig.diff
										).toString(),
									})
									.then((response) => {
										console.log(response);
									})
									.catch((error) => {
										console.error(error);
									});

								if (triggerPrice <= this.tradeConfig.minPrice) {
									this.restClient
										.submitOrder({
											category: 'spot',
											symbol: 'BTCUSDT',
											side: 'Sell',
											orderType: 'Market',
											qty: order.cumExecQty,
											marketUnit: 'baseCoin',
											price: (
												triggerPrice -
												this.tradeConfig.diff
											).toString(),
											timeInForce: 'GTC',
											orderLinkId: `sell2_${triggerPrice - this.tradeConfig.diff}_${Date.now()}`,
											orderFilter: 'StopOrder',
											triggerPrice: (
												triggerPrice -
												this.tradeConfig.diff
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
										triggerPrice - this.tradeConfig.diff,
									);
								}

								this.tradeConfig.maxPrice = Math.max(
									this.tradeConfig.maxPrice,
									triggerPrice + this.tradeConfig.diff,
								);
							}

							this.telegramService.sendMessage(
								`BYBIT
								side: ${order.side}
								status: ${order.orderStatus}
								linkedPrice: ${triggerPrice},
								avgPrice: ${order.avgPrice}
								orderType: ${order.orderType}`,
							);
						} else {
							
						}
					}
			}
		});

		ws.on('open', (data) => {
			console.log('WS OPENED');
		});

		ws.on('response', (data) => {
			if (data?.req_id === 'order') {
				this.init();
			}
		});

		ws.on('reconnect', (data) => {
			console.log('ws automatically reconnecting.... ', data?.wsKey);
		});

		ws.on('reconnected', (data) => {
			console.log('ws has reconnected ', data?.wsKey);
		});
	}

	private async init() {
		this.restClient
		.getTickers({ category: 'spot', symbol: 'BTCUSDT' })
		.then(async (res) => {
			const startPrice = Number(res.result.list[0]?.lastPrice);
		console.log('START PRICE: ', startPrice);
		this.restClient
			.submitOrder({
				category: 'spot',
				symbol: 'BTCUSDT',
				side: 'Buy',
				orderType: 'Market',
				qty: '0.01',
				marketUnit: 'baseCoin',
				timeInForce: 'GTC',
				orderLinkId: `buy_${startPrice}_${Date.now()}`,
				orderFilter: 'Order',
			})
			.then((response) => {
				console.log(response);
			})
			.catch((error) => {
				console.error(error);
			});
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
}
