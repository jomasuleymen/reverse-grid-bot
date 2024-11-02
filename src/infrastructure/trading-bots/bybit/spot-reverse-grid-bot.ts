import {
	BotState,
	TradingBotSnapshot,
} from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import { WalletBalance } from '@/domain/interfaces/trading-bots/wallet.interface';
import { TradingBotConfigEntity } from '@/infrastructure/entities/trading/trading-config.entity';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import {
	BatchOrderParamsV5,
	OrderParamsV5,
	RestClientV5,
	WalletBalanceV5,
	WebsocketClient,
} from 'bybit-api';
import sleep from 'sleep-promise';
import { TradingbotUserError } from '../common/error';

type Order = {
	price: number;
	quantity: number;
	type: 'buy' | 'sell';
	fee: number;
};

/**
 * TODO
 * 1. check for grids count. max grid count must be 25. if reaches to 25, then sell first orders to make grid count to 25.
 * 2. trade only usdt: check in validation
 */

type Credentials = {
	apiKey: string;
	apiSecret: string;
};

type Config = Pick<
	TradingBotConfigEntity,
	'takeProfit' | 'gridStep' | 'symbol' | 'gridVolume'
> & { isTestnet: boolean };

export class BybitSpotReverseGridBot {
	private readonly restClient: RestClientV5;
	private readonly wsClient: WebsocketClient;
	private readonly publicWsClient: WebsocketClient;

	private config: Config;
	public state: BotState = BotState.Idle;

	private readonly orders: Order[] = [];
	private readonly accountType: WalletBalanceV5['accountType'] = 'UNIFIED';

	private readonly requestConfig = {
		maxAttempts: 3,
	};

	private readonly gridConfig = {
		atLeastBuyCount: 2,
		maxCount: 27,
	};

	private readonly credentials: Credentials;

	private readonly marketData = {
		lastPrice: 0,
	};

	private readonly processStates = {
		isCheckingLastPrice: false,
	};

	private readonly triggerPrices = {
		maxPrice: 0,
		minPrice: 100_000_000,
	};

	private readonly snapshots: {
		start?: TradingBotSnapshot;
		end?: TradingBotSnapshot;
	} = {};

	private callback?: (msg: string) => any;

	constructor(
		options: {
			credentials: Credentials;
			config: Config;
		},
		private readonly loggerService: LoggerService,
	) {
		this.config = options.config;
		this.credentials = options.credentials;

		this.restClient = new RestClientV5({
			key: this.credentials.apiKey,
			secret: this.credentials.apiSecret,
			demoTrading: this.config.isTestnet,
			parseAPIRateLimits: true,
			recv_window: 10_000,
		});

		this.wsClient = new WebsocketClient({
			key: this.credentials.apiKey,
			secret: this.credentials.apiSecret,
			market: 'v5',
			demoTrading: this.config.isTestnet,
		});

		this.publicWsClient = new WebsocketClient({
			market: 'v5',
		});
	}

	setCallback(callback: (msg: string) => any) {
		this.callback = callback;
	}

	private async sendMessage(message: string) {
		if (this.callback) {
			this.callback(message);
		}
	}

	async start() {
		// TODO: validate config and callback
		if (this.state !== BotState.Idle) {
			return this.sendMessage(
				`Бот ну могут запускаться, bot state: ${this.state}`,
			);
		}

		const coinPriceRes = await this.restClient.getTickers({
			category: 'spot' as any,
			symbol: this.config.symbol,
		});

		if (!coinPriceRes.result?.list?.length) {
			throw new TradingbotUserError(
				`Тикер ${this.config.symbol} не найден.`,
			);
		}

		this.state = BotState.Initializing;

		// create snapshot and send it
		this.snapshots.start = await this.createSnapshot();
		await this.sendMessage(this.getSnapshotText(this.snapshots.start));

		this.configureWsEmits();

		await this.wsClient.subscribeV5('order', 'spot');
		await this.publicWsClient.subscribeV5(
			`tickers.${this.config.symbol}`,
			'spot',
		);
	}

	async stop() {
		// TODO: check bot state
		this.state = BotState.Stopping;

		await this.restClient
			.cancelAllOrders({
				category: 'spot',
				orderFilter: 'StopOrder',
			})
			.then((res) => {
				this.loggerService.info('stop.StopOrder', res);
			});
		await this.restClient
			.cancelAllOrders({
				category: 'spot',
				orderFilter: 'tpslOrder',
			})
			.then((res) => {
				this.loggerService.info('stop.tpslOrder', res);
			});

		let allQuantity = 0;
		for (const order of this.orders) {
			if (order.type === 'buy') allQuantity += order.quantity;
			else allQuantity -= order.quantity;
		}

		if (allQuantity > 0) {
			await this.restClient
				.submitOrder({
					category: 'spot',
					symbol: this.config.symbol,
					side: 'Sell',
					orderType: 'Market',
					qty: allQuantity.toFixed(6).toString(),
					marketUnit: 'baseCoin',
					timeInForce: 'IOC',
					orderFilter: 'Order',
				})
				.then((res) => {
					this.loggerService.info('stop.sellAllQuantity', res);
				});
		}

		this.snapshots.end = await this.createSnapshot();

		this.state = BotState.Stopped;
		this.sendMessage(
			`------ Открытие ------\n\n` +
				this.getSnapshotText(this.snapshots.start!) +
				'\n\n' +
				`------ Закрытие ------\n\n` +
				this.getSnapshotText(this.snapshots.end!),
		);
		this.cleanUp();
	}

	private cleanUp() {
		this.wsClient.closeAll(true);
		this.publicWsClient.closeAll(true);

		this.wsClient.removeAllListeners();
		this.publicWsClient.removeAllListeners();

		// @ts-ignore
		this.wsClient = null;
		// @ts-ignore
		this.publicWsClient = null;
	}

	private async createSnapshot(): Promise<TradingBotSnapshot> {
		// get current price of symbol
		const coinPriceRes = await this.restClient.getTickers({
			category: 'spot' as any,
			symbol: this.config.symbol,
		});

		const foundTicker = coinPriceRes.result.list.find(
			(value) => value.symbol === this.config.symbol,
		);

		if (!foundTicker) {
			throw new Error(`Тикер ${this.config.symbol} не найден`);
		}

		// Get wallet balance
		const walletBalanceRes = await this.restClient.getWalletBalance({
			accountType: this.accountType,
		});

		const accountBalance = walletBalanceRes.result.list.find(
			(wallet) => wallet.accountType === this.accountType,
		);

		if (!accountBalance)
			throw new Error(`Счёт ${this.accountType} не найден`);

		const walletBalance: WalletBalance = {
			accountType: accountBalance.accountType,
			balanceInUsd: Number(accountBalance.totalWalletBalance),
			coins: accountBalance.coin.map((coin) => ({
				coin: coin.coin,
				balance: Number(coin.walletBalance),
				usdValue: Number(coin.usdValue),
			})),
		};

		return {
			currentPrice: Number(foundTicker.lastPrice),
			datetime: new Date(),
			walletBalance,
		};
	}

	private getSnapshotText(snapshot: TradingBotSnapshot): string {
		const coin = snapshot.walletBalance.coins
			.map(
				(c) =>
					`----- ${c.coin} -----\n` +
					`Баланс: ${c.balance.toFixed(4)} ${c.coin}\n` +
					`Баланс(USD): ${c.usdValue.toFixed(1)} USD\n`,
			)
			.join('\n');

		return (
			`Счёт: ${snapshot.walletBalance.accountType}\n` +
			`Баланс(USD): ${snapshot.walletBalance.balanceInUsd.toFixed(1)}\n` +
			`\n${coin}\n` +
			`Цена ${this.config.symbol}: ${snapshot.currentPrice}\n` +
			`Время: ${snapshot.datetime.toLocaleString('ru-RU', {
				timeZone: 'Asia/Almaty', // Almaty time zone
			})}`
		);
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
		this.publicWsClient.on('update', (data) => {
			if (!data) return;
			if (data.topic === `tickers.${this.config.symbol}`) {
				if (data.data) {
					this.marketData.lastPrice = Number(data.data.lastPrice);

					if (!this.processStates.isCheckingLastPrice) {
						this.checkLastPrice(Number(data.data.lastPrice));
					}
				}
			}
		});
		this.wsClient.on('open', () => {
			this.loggerService.info('WS OPENED');
		});

		this.wsClient.on('response', (data) => {
			if (!data) return;

			if (data.success && data.req_id === 'order') {
				this.init();
			}
		});

		this.wsClient.on('reconnect', (data) => {
			this.loggerService.info('ws reconnecting.... ');
		});

		this.wsClient.on('reconnected', (data) => {
			this.loggerService.info('ws reconnected ');
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
		if (this.state !== BotState.Running) return;

		const triggerPrice = this.getTriggerPrice(order);
		if (!triggerPrice) return;

		const fee =
			order.feeCurrency === 'USDT'
				? Number(order.cumExecFee)
				: Number(order.cumExecFee) * Number(order.avgPrice);

		const orders: BatchOrderParamsV5[] = [];

		if (order.side === 'Buy') {
			this.orders.push({
				price: Number(order.avgPrice),
				quantity: Number(order.qty),
				type: 'buy',
				fee: fee,
			});

			orders.push(
				this.getStopLossOptions(
					triggerPrice - this.config.gridStep,
					order.cumExecQty,
				),
			);

			let maxTriggerPrice =
				triggerPrice +
				this.config.gridStep * this.gridConfig.atLeastBuyCount;

			while (this.triggerPrices.maxPrice < maxTriggerPrice) {
				const newTriggerPrice =
					this.triggerPrices.maxPrice + this.config.gridStep;

				orders.push(
					this.getStopOrderOptions(
						'Buy',
						newTriggerPrice,
						order.cumExecQty,
					),
				);

				this.updateTriggerPrices(newTriggerPrice);
			}
		} else if (order.side === 'Sell') {
			this.orders.push({
				price: Number(order.avgPrice),
				quantity: Number(order.qty),
				type: 'sell',
				fee: fee,
			});
			orders.push(
				this.getStopOrderOptions(
					'Buy',
					triggerPrice + this.config.gridStep,
					order.cumExecQty,
				),
			);
			this.updateTriggerPrices(triggerPrice + this.config.gridStep);
		}

		this.submitBatchOrdersWithRetry(orders);
		const sellCount = this.orders.filter((o) => o.type === 'sell').length;
		const buyCount = this.orders.length - sellCount;
		// if (buyCount - sellCount >= this.tradeConfig.cancelOnBuyCount) {
		// 	this.stopProcess();
		// } else if (orders.length) {
		const pnl = this.calculatePnL(this.orders, this.marketData.lastPrice);
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
			- Текущая цена: ${this.marketData.lastPrice.toFixed(2)}
			🔄 **Общее количество операций**
			- Покупки: ${buyCount}
			- Продажи: ${sellCount}`;

		this.sendMessage(message);
		// }
	}
	private calculatePnL(orders: Order[], currentPrice: number) {
		const buyStack: Order[] = []; // Stack to track buy orders for stop-losses
		let realizedPnL = 0;
		if (!currentPrice && orders.length) {
			currentPrice = orders[orders.length - 1]!.price;
		}

		orders.forEach((order) => {
			if (order.type === 'buy') {
				// Push the buy order onto the stack
				buyStack.push(order);
			} else if (order.type === 'sell' && buyStack.length > 0) {
				// Pop the latest buy order from the stack for each sell
				const lastBuy = buyStack.pop();
				if (lastBuy) {
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

	private getBaseOrderOptions(
		side: 'Buy' | 'Sell',
		qty: number,
	): OrderParamsV5 {
		return {
			category: 'spot',
			side: side,
			qty: qty.toString(),
			symbol: this.config.symbol,
			orderType: 'Market',
			marketUnit: 'baseCoin',
			timeInForce: 'GTC',
		};
	}

	private getStopOrderOptions(
		side: 'Buy' | 'Sell',
		price: number,
		qty: number,
	): OrderParamsV5 {
		return {
			...this.getBaseOrderOptions(side, qty),
			orderLinkId: `${side}_${price}_${Date.now()}`,
			orderFilter: 'StopOrder',
			triggerPrice: price.toString(),
		};
	}

	private getStopLossOptions(price: number, qty: number): OrderParamsV5 {
		return {
			...this.getBaseOrderOptions('Sell', qty),
			orderLinkId: `SL_${price}_${Date.now()}`,
			orderFilter: 'tpslOrder',
			triggerPrice: price.toString(),
			slOrderType: 'Market',
		};
	}
	private updateTriggerPrices(price: number) {
		this.triggerPrices.maxPrice = Math.max(
			this.triggerPrices.maxPrice,
			price,
		);
		this.triggerPrices.minPrice = Math.min(
			this.triggerPrices.minPrice,
			price,
		);
	}
	private async submitOrderWithRetry(
		orderParams: OrderParamsV5,
		attempts = this.requestConfig.maxAttempts,
	): Promise<void> {
		this.loggerService.info('submitOrderWithRetry', orderParams);
		while (attempts > 0) {
			try {
				const response = await this.restClient.submitOrder(orderParams);
				if (response.retCode === 0) {
					this.loggerService.info(
						'Order placed successfully:',
						response,
					);
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

				await sleep(800);
			}
		}
	}
	private async submitBatchOrdersWithRetry(
		ordersParams: BatchOrderParamsV5[],
		attempts = this.requestConfig.maxAttempts,
	): Promise<void> {
		if (ordersParams.length === 0) return;

		this.loggerService.info('submitOrderWithRetry', ordersParams);

		while (attempts > 0) {
			try {
				const response = await this.restClient.batchSubmitOrders(
					'spot' as any,
					ordersParams,
				);
				// pinoLogger.info(response);
				if (response.retCode === 0) {
					// const notPlacedOrders = response.result.list.filter(
					// 	(order) => !!order.orderId,
					// );
					this.loggerService.info('Orders placed successfully');
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

				await sleep(800);
			}
		}
	}
	private async init() {
		if (
			this.state !== BotState.Idle &&
			this.state !== BotState.Initializing
		)
			return;

		try {
			const res = await this.restClient.getTickers({
				category: 'spot',
				symbol: this.config.symbol,
			});
			const startPrice = Number(res.result.list[0]?.lastPrice);
			this.updateTriggerPrices(startPrice);
			this.state = BotState.Running;
			await this.submitOrderWithRetry({
				...this.getBaseOrderOptions('Buy', this.config.gridVolume),
				orderLinkId: `Buy_${startPrice}_${Date.now()}`,
				orderFilter: 'Order',
			});
			``;
		} catch (error) {
			console.error('Error initializing orders:', error);
		}
	}

	private async checkLastPrice(lastPrice: number) {
		if (
			this.processStates.isCheckingLastPrice ||
			this.state !== BotState.Running
		)
			return;
		this.processStates.isCheckingLastPrice = true;
		const orders: BatchOrderParamsV5[] = [];

		while (
			this.triggerPrices.minPrice >=
			lastPrice + this.config.gridStep * 2
		) {
			const newTriggerPrice =
				this.triggerPrices.minPrice - this.config.gridStep;

			orders.push(
				this.getStopOrderOptions(
					'Buy',
					newTriggerPrice,
					this.config.gridVolume,
				),
			);

			this.updateTriggerPrices(newTriggerPrice);
		}

		if (orders.length) {
			await this.submitBatchOrdersWithRetry(orders);
		}

		this.processStates.isCheckingLastPrice = false;
	}
}
