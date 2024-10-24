import logger from '@/infrastructure/services/logger/pino.service';
import { TelegramService } from '@/infrastructure/services/telegram/telegram.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import {
	BatchOrderParamsV5,
	OrderParamsV5,
	RestClientV5,
	WebsocketClient,
} from 'bybit-api';

@Injectable()
export class BybitSpotAlgo1 {
	private readonly apiKey: string;
	private readonly apiSecret: string;
	private readonly isTestMode: boolean;
	private readonly restClient: RestClientV5;
	private readonly wsClient: WebsocketClient;
	private readonly publicWsClient: WebsocketClient;

	private readonly tradeConfig = {
		startPrice: 0,
		diff: 50,
		directionOrdersCount: 3,
		lastPrice: 0,
		maxPrice: 0,
		minPrice: 100_000_000,
	};

	private readonly maxAttempts = 3;

	constructor(
		private readonly configService: ConfigService,
		private readonly telegramService: TelegramService,
		private readonly schedulerRegistry: SchedulerRegistry,
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
			recv_window: 10_000,
		});

		this.wsClient = new WebsocketClient({
			key: this.apiKey,
			secret: this.apiSecret,
			market: 'v5',
			demoTrading: this.isTestMode,
		});

		this.publicWsClient = new WebsocketClient({
			market: 'v5',
		});

		this.wsClient.subscribeV5('order', 'spot');
		this.publicWsClient
			.subscribeV5('tickers.BTCUSDT', 'spot')
			.then((res) => {
				console.log('res', res);
			})
			.catch((err) => {
				console.log('err', err);
			});
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
			} else if (data.topic === 'tickers.BTCUSDT') {
				console.log(data);
			}
		});

		this.publicWsClient.on('update', (data) => {
			if (!data) return;

			if (data.topic === 'tickers.BTCUSDT') {
				if (data.data) {
					this.tradeConfig.lastPrice = Number(data.data.lastPrice);
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

	private getTriggerPrice(order: any): number | null {
		if (!order.orderLinkId) return null;
		const [idPrefix, triggerPriceStr] = (order.orderLinkId || '').split(
			'_',
		);

		if (!triggerPriceStr) return null;

		return Number(triggerPriceStr) || null;
	}

	private handleFilledOrder(order: any) {
		const triggerPrice = this.getTriggerPrice(order);
		if (!triggerPrice) return;

		const orders: BatchOrderParamsV5[] = [];

		if (order.side === 'Buy') {
			orders.push(
				this.getStopLossOption(
					triggerPrice - this.tradeConfig.diff,
					order.cumExecQty,
				),
			);

			if (
				triggerPrice + this.tradeConfig.diff * 2 >
				this.tradeConfig.maxPrice
			) {
				orders.push(
					this.getTriggerOrderOptions(
						'Buy',
						triggerPrice + this.tradeConfig.diff * 2,
						order.cumExecQty,
					),
				);

				this.updateTradeConfigPrices(
					triggerPrice + this.tradeConfig.diff * 2,
				);
			}
			this.updateTradeConfigPrices(triggerPrice);
		} else if (order.side === 'Sell') {
			orders.push(
				this.getTriggerOrderOptions(
					'Buy',
					triggerPrice + this.tradeConfig.diff,
					order.cumExecQty,
				),
			);
			// this.updateTradeConfigPrices(triggerPrice + this.tradeConfig.diff);
		}

		console.log(
			'Trigger price: ',
			triggerPrice,
			'new place orders: ',
			orders,
		);

		if (orders.length) this.submitBatchOrdersWithRetry(orders);
		this.telegramService.sendMessage(
			`BYBIT\nSide: ${order.side}\nStatus: ${order.orderStatus}\nLinked Price: ${triggerPrice}\nAvg Price: ${order.avgPrice}\nOrder Type: ${order.orderType}`,
		);
	}

	// Unified method to create both Buy and Sell orders
	private getTriggerOrderOptions(
		side: 'Buy' | 'Sell',
		price: number,
		qty: string,
	): OrderParamsV5 {
		return {
			category: 'spot',
			symbol: 'BTCUSDT',
			side: side,
			orderType: 'Market',
			qty: qty,
			marketUnit: 'baseCoin',
			timeInForce: 'GTC',
			orderLinkId: `${side}_${price}_${Date.now()}`,
			orderFilter: 'StopOrder',
			triggerPrice: price.toString(),
		};
	}
	// Unified method to create both Buy and Sell orders
	private getStopLossOption(price: number, qty: string): OrderParamsV5 {
		return {
			category: 'spot',
			symbol: 'BTCUSDT',
			side: 'Sell',
			orderType: 'Market',
			qty: qty,
			marketUnit: 'baseCoin',
			orderLinkId: `SL_${price}_${Date.now()}`,
			orderFilter: 'tpslOrder',
			triggerPrice: price.toString(),
			slOrderType: 'Market',
		};
	}

	private updateTradeConfigPrices(price: number) {
		this.tradeConfig.maxPrice = Math.max(this.tradeConfig.maxPrice, price);
		this.tradeConfig.minPrice = Math.min(this.tradeConfig.minPrice, price);
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

	private async submitBatchOrdersWithRetry(
		ordersParams: BatchOrderParamsV5[],
		attempts = this.maxAttempts,
	): Promise<void> {
		while (attempts > 0) {
			try {
				const response = await this.restClient.batchSubmitOrders(
					'spot' as any,
					ordersParams,
				);
				logger.info(response);

				if (response.retCode === 0) {
					// const notPlacedOrders = response.result.list.filter(
					// 	(order) => !!order.orderId,
					// );

					// console.log('Not placed orders', notPlacedOrders);

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

			await this.placeInitialOrders(startPrice);
		} catch (error) {
			console.error('Error initializing orders:', error);
		}
	}

	private async placeInitialOrders(startPrice: number) {
		this.tradeConfig.startPrice = startPrice;
		this.tradeConfig.lastPrice = startPrice;
		this.tradeConfig.minPrice = startPrice;
		this.tradeConfig.maxPrice = startPrice;

		const qty = '0.002';

		let orders: BatchOrderParamsV5[] = [
			{
				symbol: 'BTCUSDT',
				side: 'Buy',
				orderType: 'Market',
				qty: qty,
				marketUnit: 'baseCoin',
				timeInForce: 'GTC',
				orderLinkId: `${'Buy'}_${startPrice}_${Date.now()}`,
				orderFilter: 'Order',
				triggerPrice: startPrice.toString(),
			} as any,
		];

		for (let i = 1; i <= this.tradeConfig.directionOrdersCount; i++) {
			const triggerPrice = startPrice + i * this.tradeConfig.diff;
			orders.push(this.getTriggerOrderOptions('Buy', triggerPrice, qty));

			this.updateTradeConfigPrices(triggerPrice);
		}

		await this.submitBatchOrdersWithRetry(orders);

		const job = this.schedulerRegistry.getCronJob('check_bottom_price');
		job.start();
	}

	@Cron(CronExpression.EVERY_SECOND, {
		disabled: true,
		name: 'check_bottom_price',
	})
	private async checkLastPrice() {
		const job = this.schedulerRegistry.getCronJob('check_bottom_price');
		job.stop();

		if (
			this.tradeConfig.lastPrice &&
			this.tradeConfig.minPrice - this.tradeConfig.lastPrice >=
				this.tradeConfig.diff * 2
		) {
			await this.submitOrderWithRetry(
				this.getTriggerOrderOptions(
					'Buy',
					this.tradeConfig.minPrice - this.tradeConfig.diff,
					'0.002',
				),
			);

			this.updateTradeConfigPrices(
				this.tradeConfig.minPrice - this.tradeConfig.diff,
			);
		}

		job.start();
	}
}
