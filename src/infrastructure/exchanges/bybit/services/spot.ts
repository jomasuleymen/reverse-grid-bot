import { TelegramService } from '@/infrastructure/services/telegram/telegram.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderParamsV5, RestClientV5, WebsocketClient } from 'bybit-api';

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

	private readonly maxAttempts = 3;

	constructor(
		private readonly configService: ConfigService,
		private readonly telegramService: TelegramService,
	) {
		this.apiKey = this.configService.getOrThrow('bybit.api.key');
		this.apiSecret = this.configService.getOrThrow('bybit.api.secret');
		this.tradeConfig.diff =
			Number(this.configService.get('bybit.spot.diff')) || 50;

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
		this.configureWsEmits();
	}

	private configureWsEmits() {
		this.wsClient.on('update', (data) => {
			if (!data) return;

			if (data.topic === 'order' && data.data) {
				for (let order of data.data) {
					if (order.orderStatus === 'Filled') {
						this.handleFilledOrder(order);
					}
				}
			}
		});

		this.wsClient.on('open', () => {
			console.log('WS OPENED');
		});

		this.wsClient.on('response', (data) => {
			if (data?.req_id === 'order') {
				this.init();
			}
		});

		this.wsClient.on('reconnect', (data) => {
			console.log('ws reconnecting.... ', data?.wsKey);
		});

		this.wsClient.on('reconnected', (data) => {
			console.log('ws reconnected ', data?.wsKey);
		});
	}

	private handleFilledOrder(order: any) {
		const [idPrefix, triggerPriceStr] = (order.orderLinkId || '').split(
			'_',
		);
		const triggerPrice = Number(triggerPriceStr || order.avgPrice);

		if (order.side === 'Buy') {
			this.createTriggerOrder(
				'Sell',
				triggerPrice - this.tradeConfig.diff,
				order.cumExecQty,
			);

			if (triggerPrice >= this.tradeConfig.maxPrice) {
				this.createTriggerOrder(
					'Buy',
					triggerPrice + this.tradeConfig.diff,
					order.cumExecQty,
				);
				this.updateTradeConfigPrices(
					triggerPrice + this.tradeConfig.diff,
				);
			}
			this.updateTradeConfigPrices(triggerPrice - this.tradeConfig.diff);
		} else if (order.side === 'Sell') {
			this.createTriggerOrder(
				'Buy',
				triggerPrice + this.tradeConfig.diff,
				order.cumExecQty,
			);

			if (triggerPrice <= this.tradeConfig.maxPrice) {
				this.createTriggerOrder(
					'Sell',
					triggerPrice - this.tradeConfig.diff,
					order.cumExecQty,
				);
				this.updateTradeConfigPrices(
					triggerPrice - this.tradeConfig.diff,
				);
			}

			this.updateTradeConfigPrices(triggerPrice + this.tradeConfig.diff);
		}

		this.telegramService.sendMessage(
			`BYBIT\nSide: ${order.side}\nStatus: ${order.orderStatus}\nLinked Price: ${triggerPrice}\nAvg Price: ${order.avgPrice}\nOrder Type: ${order.orderType}`,
		);
	}

	// Unified method to create both Buy and Sell orders
	private createTriggerOrder(
		side: 'Buy' | 'Sell',
		price: number,
		qty: string,
	) {
		this.submitOrderWithRetry({
			category: 'spot',
			symbol: 'BTCUSDT',
			side: side, // Place the opposite order
			orderType: 'Market',
			qty: qty,
			marketUnit: 'baseCoin',
			price: price.toString(),
			timeInForce: 'GTC',
			orderLinkId: `${side}_${price}_${Date.now()}`,
			orderFilter: 'StopOrder',
			triggerPrice: price.toString(),
		});
	}

	private updateTradeConfigPrices(triggerPrice: number) {
		this.tradeConfig.maxPrice = Math.max(
			this.tradeConfig.maxPrice,
			triggerPrice + this.tradeConfig.diff,
		);
		this.tradeConfig.minPrice = Math.min(
			this.tradeConfig.minPrice,
			triggerPrice - this.tradeConfig.diff,
		);
	}

	private async submitOrderWithRetry(
		orderParams: OrderParamsV5,
		attempts = this.maxAttempts,
	): Promise<void> {
		while (attempts > 0) {
			try {
				const response = await this.restClient.submitOrder(orderParams);
				if (response.retCode === 0) {
					console.log('Order placed successfully:', response);
					return;
				} else {
					throw new Error('Order failed, retrying...');
				}
			} catch (error) {
				console.error(
					`Error placing order, attempts left: ${attempts - 1}`,
					error,
				);
				attempts -= 1;
				if (attempts === 0) {
					console.error(
						'Max retry attempts reached. Order placement failed.',
					);
					return;
				}
			}
		}
	}

	private async init() {
		try {
			const res = await this.restClient.getTickers({
				category: 'spot',
				symbol: 'BTCUSDT',
			});
			const startPrice = Number(res.result.list[0]?.lastPrice);
			console.log('START PRICE: ', startPrice);

			// await this.placeInitialOrders(startPrice);
		} catch (error) {
			console.error('Error initializing orders:', error);
		}
	}

	private async placeInitialOrders(startPrice: number) {
		await this.submitOrderWithRetry({
			category: 'spot',
			symbol: 'BTCUSDT',
			side: 'Buy',
			orderType: 'Market',
			qty: '0.01',
			marketUnit: 'baseCoin',
			timeInForce: 'GTC',
			orderLinkId: `buy_${startPrice}_${Date.now()}`,
			orderFilter: 'Order',
		});
	}
}
