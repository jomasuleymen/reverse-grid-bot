import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	NewFuturesOrderParams,
	USDMClient,
	WebsocketClient,
	WsMessageBookTickerEventFormatted,
	WsMessageFuturesUserDataTradeUpdateEventFormatted,
} from 'binance';

@Injectable()
export class BinanceFuturesReverseGridBot {
	private readonly apiKey: string;
	private readonly apiSecret: string;
	private readonly isTestNet: boolean;
	private readonly restUsdmClient: USDMClient;
	private readonly wsClient: WebsocketClient;

	private readonly tradeConfig = {
		diff: 1000,
	};

	constructor(private readonly configService: ConfigService) {
		this.apiKey = this.configService.getOrThrow('binance.api.key');
		this.apiSecret = this.configService.getOrThrow('binance.api.secret');

		if (!this.apiKey || !this.apiSecret) {
			throw new Error('Binance credentials not provided');
		}

		this.isTestNet = this.configService.getOrThrow('binance.isTestnet');

		this.restUsdmClient = new USDMClient(
			{
				api_key: this.apiKey,
				api_secret: this.apiSecret,
				recvWindow: 10_000,
			},
			{},
			this.isTestNet,
		);

		const testWslUrl = 'wss://stream.binancefuture.com';
		this.wsClient = new WebsocketClient({
			api_key: this.apiKey,
			api_secret: this.apiSecret,
			beautify: true,
			wsUrl: this.isTestNet ? testWslUrl : undefined,
		});

		// this.configureWsEmits(this.wsClient);

		// // this.wsClient.subscribeSymbolBookTicker('BTCUSDT', 'usdm');
		// this.wsClient.subscribeUsdFuturesUserDataStream(true);
	}

	async createNewOrder(options?: { isStop: boolean; price: number }) {
		const payload: NewFuturesOrderParams = {
			side: 'BUY',
			symbol: 'BTCUSDT',
			positionSide: 'LONG',
			type: 'STOP',
			quantity: 0.002,
			workingType: 'CONTRACT_PRICE',
			timeInForce: 'GTC',
			priceProtect: 'TRUE',
		};
		if (options?.isStop) {
			payload.type = 'STOP';
			payload.stopPrice = options.price - 100;
			payload.price = options.price;
		}

		this.restUsdmClient
			.submitNewOrder(payload)
			.then((res) => {
				console.log(res);
			})
			.catch((err) => {
				console.error('error order', err);

				// Order would immediately trigger.
				if (err?.code === -2021) {
					this.restUsdmClient.submitNewOrder({
						side: 'BUY',
						symbol: 'BTCUSDT',
						positionSide: 'LONG',
						quantity: 0.002,
						workingType: 'CONTRACT_PRICE',
						type: 'MARKET',
						priceProtect: 'TRUE',
					});
				}
			});
	}

	async createNewOrders(options: { isStop: boolean; price: number }[]) {
		const payloads: Array<NewFuturesOrderParams<string>> = options.map(
			(option) => {
				const payload: NewFuturesOrderParams<string> = {
					side: 'BUY',
					symbol: 'BTCUSDT',
					positionSide: 'LONG',
					type: 'STOP',
					quantity: '0.002',
					workingType: 'CONTRACT_PRICE',
					timeInForce: 'GTC',
					priceProtect: 'TRUE',
				};
				if (option?.isStop) {
					payload.type = 'STOP';
					payload.stopPrice = (option.price - 100).toString();
					payload.price = option.price.toString();
				}

				return payload;
			},
		);

		this.restUsdmClient
			.submitMultipleOrders(payloads)
			.then((res) => {
				console.log(res);
			})
			.catch((err) => {
				console.error(err);
			});
	}

	private onBookTicker(data: WsMessageBookTickerEventFormatted) {
		// console.log('bookTicker: ', data);
	}

	private onOrderTradeUpdate(
		data: WsMessageFuturesUserDataTradeUpdateEventFormatted,
	) {
		console.log('new user trade: ', data);

		if (
			(data.order.orderType === 'STOP',
			data.order.executionType === 'TRADE',
			data.order.orderStatus === 'FILLED')
		) {
			if (data.order.orderSide === 'BUY') {
				if (data.order.averagePrice) {
					this.restUsdmClient
						.submitNewOrder({
							side: 'SELL',
							symbol: 'BTCUSDT',
							positionSide: 'LONG',
							quantity: data.order.originalQuantity,
							workingType: 'CONTRACT_PRICE',
							timeInForce: 'GTE_GTC',
							type: 'STOP',
							stopPrice:
								data.order.averagePrice - this.tradeConfig.diff,
							price:
								data.order.averagePrice -
								this.tradeConfig.diff +
								100,
							priceProtect: 'TRUE',
						})
						.then((res) => {
							console.log('success order: ', res);
						})
						.catch((err) => {
							console.error('error order', err);

							// Order would immediately trigger.
							if (err?.code === -2021) {
								this.restUsdmClient.submitNewOrder({
									side: 'SELL',
									symbol: 'BTCUSDT',
									positionSide: 'LONG',
									quantity: data.order.originalQuantity,
									workingType: 'CONTRACT_PRICE',
									type: 'MARKET',
									priceProtect: 'TRUE',
								});
							}
						});
				}
			} else if (data.order.orderSide === 'SELL') {
				if (data.order.averagePrice) {
					this.createNewOrder({
						isStop: true,
						price: data.order.averagePrice + this.tradeConfig.diff,
					});
				}
			}
		}
	}

	private configureWsEmits(ws: WebsocketClient) {
		ws.on('formattedMessage', (data) => {
			if (!Array.isArray(data)) {
				if (data.eventType === 'bookTicker')
					return this.onBookTicker(data);
				if (data.eventType === 'ORDER_TRADE_UPDATE')
					return this.onOrderTradeUpdate(data);
			}

			console.log(data);
		});

		ws.on('open', (data) => {
			console.log(
				'connection opened open:',
				data.wsKey,
				data.ws.target.url,
			);

			this.restUsdmClient
				.getSymbolPriceTicker({ symbol: 'BTCUSDT' })
				.then((res) => {
					if (Array.isArray(res)) return;

					const startPrice = 66000;
					const createOrders = [];

					for (let i = 0; i < 5; i++)
						createOrders.push({
							isStop: true,
							price: startPrice + this.tradeConfig.diff * i,
						});

					this.createNewOrders(createOrders);
				});
		});

		ws.on('reconnecting', (data) => {
			console.log('ws automatically reconnecting.... ', data?.wsKey);
		});

		ws.on('reconnected', (data) => {
			console.log('ws has reconnected ', data?.wsKey);
		});
	}
}
