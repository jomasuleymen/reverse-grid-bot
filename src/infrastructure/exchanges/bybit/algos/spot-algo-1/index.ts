import pinoLogger from '@/infrastructure/services/logger/pino.service';
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
import sleep from 'sleep-promise';

type Order = {
	price: number;
	quantity: number;
	type: 'buy' | 'sell';
	fee: number;
};

@Injectable()
export class BybitSpotAlgo1 {
	private readonly apiKey: string;
	private readonly apiSecret: string;
	private readonly isTestMode: boolean;
	private readonly restClient: RestClientV5;
	private readonly wsClient: WebsocketClient;
	private readonly publicWsClient: WebsocketClient;

	private tradingSummaries: string[] = [];

	private tradeConfig;
	private isRunning = true;

	private readonly maxAttempts = 3;

	private readonly orders: Order[] = [];

	constructor(
		private readonly configService: ConfigService,
		private readonly telegramService: TelegramService,
		private readonly schedulerRegistry: SchedulerRegistry,
	) {
		this.apiKey = this.configService.getOrThrow('bybit.api.key');
		this.apiSecret = this.configService.getOrThrow('bybit.api.secret');
		this.tradeConfig = this.getTradeConfig();

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

		this.sendSummary();

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

		this.telegramService.getBot().onText(/\/stop/, async () => {
			await this.stopProcess();
		});
	}

	private sendSummary() {
		this.restClient
			.getWalletBalance({ accountType: 'UNIFIED' })
			.then((res) => {
				pinoLogger.info(res);
				const summary = res.result.list
					.map((item) => {
						const coin = item.coin
							.map(
								(c) =>
									`\tМонета: ${c.coin}\n` +
									`\tБаланс: ${c.walletBalance} ${c.coin}`,
							)
							.join('\n\t-----------\n');

						return (
							`Счёт: ${item.accountType}\n` +
							`Всего активов: ${item.totalEquity} USD\n` +
							`Доступный баланс: ${item.totalAvailableBalance} USD\n` +
							`${coin}`
						);
					})
					.join('\n\n');

				this.tradingSummaries.push(summary);
				this.telegramService.sendMessage(
					this.tradingSummaries.join('\n\n'),
				);
			});
	}

	private getTradeConfig() {
		return {
			startPrice: 0,
			diff: 50,
			directionOrdersCount: 3,
			cancelOnBuyCount: 20,
			lastPrice: 0,
			maxPrice: 0,
			minPrice: 100_000_000,
		};
	}

	private async stopProcess() {
		this.isRunning = false;
		const job = this.schedulerRegistry.getCronJob('check_bottom_price');
		job.stop();

		this.restClient
			.cancelAllOrders({
				category: 'spot',
				orderFilter: 'StopOrder',
			})
			.then((res) => {
				console.log(res);
			});
		await this.restClient
			.cancelAllOrders({
				category: 'spot',
				orderFilter: 'tpslOrder',
			})
			.then((res) => {
				console.log(res);
			});

		let allQuantity = 0;

		await this.restClient
			.getWalletBalance({ accountType: 'UNIFIED' })
			.then((res) => {
				if (res.result.list.length) {
					const found = res.result.list[0]?.coin.find(
						(o) => o.coin === 'BTC',
					);

					if (found) allQuantity = Number(found.walletBalance);
				}
			});

		await this.restClient
			.submitOrder({
				category: 'spot',
				symbol: 'BTCUSDT',
				side: 'Sell',
				orderType: 'Market',
				qty: allQuantity.toString(),
				marketUnit: 'baseCoin',
				timeInForce: 'GTC',
				orderLinkId: `${'Sell'}_all_${Date.now()}`,
				orderFilter: 'Order',
			})
			.then((res) => {
				console.log(res);
			});

		// this.tradeConfig = this.getTradeConfig();

		this.telegramService.sendMessage('Успешно процесс остановился');
		await sleep(1000);
		this.sendSummary();
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
		if (!this.isRunning) return;

		const triggerPrice = this.getTriggerPrice(order);
		if (!triggerPrice) return;

		const orders: BatchOrderParamsV5[] = [];

		if (order.side === 'Buy') {
			this.orders.push({
				price: Number(order.avgPrice),
				quantity: Number(order.qty),
				type: 'buy',
				fee: Number(order.cumExecFee),
			});
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
		} else if (order.side === 'Sell') {
			this.orders.push({
				price: Number(order.avgPrice),
				quantity: Number(order.qty),
				type: 'sell',
				fee: Number(order.cumExecFee),
			});
			orders.push(
				this.getTriggerOrderOptions(
					'Buy',
					triggerPrice + this.tradeConfig.diff,
					order.cumExecQty,
				),
			);
			this.updateTradeConfigPrices(triggerPrice + this.tradeConfig.diff);
		}

		this.submitBatchOrdersWithRetry(orders);
		const sellCount = this.orders.filter((o) => o.type === 'sell').length;
		const buyCount = this.orders.length - sellCount;
		// if (buyCount - sellCount >= this.tradeConfig.cancelOnBuyCount) {
		// 	this.stopProcess();
		// } else if (orders.length) {
		const pnl = this.calculatePnL(this.orders, this.tradeConfig.lastPrice);

		const message = `BYBIT
			📈 **Информация об ордере**
			- Сторона: ${order.side}
			- Триггерная цена: ${triggerPrice}
			- Покупная цена: ${order.avgPrice}
			  
			💰 **Доходность**
			- Реализованная прибыль: ${pnl.realizedPnL.toFixed(2)}
			- Нереализованная прибыль: ${pnl.unrealizedPnL.toFixed(2)}
			- Прибыль: ${(pnl.unrealizedPnL + pnl.realizedPnL).toFixed(2)}
			
			📊 **Текущая торговая статистика**
			- Текущая цена: ${this.tradeConfig.lastPrice.toFixed(2)}
			  
			🔄 **Общее количество операций**
			- Покупки: ${buyCount}
			- Продажи: ${sellCount}`;

		this.telegramService.sendMessage(message);

		// }
	}

	private calculatePnL(orders: Order[], currentPrice: number) {
		const buyStack: Order[] = []; // Stack to track buy orders for stop-losses
		let realizedPnL = 0;

		orders.forEach((order) => {
			if (order.type === 'buy') {
				// Push the buy order onto the stack
				buyStack.push(order);
			} else if (order.type === 'sell' && buyStack.length > 0) {
				// Pop the latest buy order from the stack for each sell
				const lastBuy = buyStack.pop();
				if (lastBuy) {
					console.log(
						'TRIGGER',
						lastBuy.price,
						order.price,
						order.price - lastBuy.price,
						lastBuy.quantity,
						order.quantity,
					);
					// Calculate realized P&L for this sell using the latest buy price
					const sellPnL =
						(order.price - lastBuy.price) * order.quantity;
					realizedPnL += sellPnL;
				}
			}

			realizedPnL -= order.fee;
		});

		// Calculate unrealized P&L for remaining holdings based on the current market price
		const unrealizedPnL = buyStack.reduce((total, buyOrder) => {
			return total + (currentPrice - buyOrder.price) * buyOrder.quantity;
		}, 0);

		return {
			realizedPnL,
			unrealizedPnL,
		};
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
				pinoLogger.info(response);

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

		const qty = '0.01';

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
					'0.01',
				),
			);

			this.updateTradeConfigPrices(
				this.tradeConfig.minPrice - this.tradeConfig.diff,
			);
		}

		job.start();
	}
}
