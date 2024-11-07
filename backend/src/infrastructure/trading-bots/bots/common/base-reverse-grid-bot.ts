import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import {
	BotState,
	CreateTradingBotOrder,
	IExchangeCredentials,
	IStartReverseBotOptions,
	ITradingBot,
	ITradingBotConfig,
	OrderCreationType,
	TradingBotOrder,
	TradingBotSnapshot,
} from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import { WalletBalance } from '@/domain/interfaces/trading-bots/wallet.interface';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
import {
	clearIntervalAsync,
	setIntervalAsync,
	SetIntervalAsyncTimer,
} from 'set-interval-async';
import sleep from 'sleep-promise';

type TradingBotState = BotState.Idle | BotState.Running | BotState.Stopped;

@Injectable({ scope: Scope.TRANSIENT })
export abstract class BaseReverseGridBot implements ITradingBot {
	protected config: ITradingBotConfig;
	protected credentials: IExchangeCredentials;
	protected symbol: string;

	@Inject(LoggerService)
	protected readonly logger: LoggerService;

	private state: TradingBotState = BotState.Idle;
	private readonly orders: TradingBotOrder[] = [];
	private readonly snapshots: {
		start?: TradingBotSnapshot;
		end?: TradingBotSnapshot;
	} = {};

	private callBacks: IStartReverseBotOptions['callBacks'];

	private readonly minBaseWalletUsdValue = 10;
	private readonly requestConfig = {
		defaultAttempts: 2,
	};
	private readonly marketData = {
		lastPrice: 0,
	};
	private readonly gridConfig = {
		atLeastBuyCount: 2,
		maxCount: 27,
	};

	private readonly triggerPrices = {
		maxPrice: 0,
		minPrice: 100_000_000,
	};

	// Processes state
	private isCheckingLastPrice: boolean = false;
	private isMadeFirstOrder: boolean = false;

	private checkBotStateTimer: SetIntervalAsyncTimer<any>;

	public async start(options: IStartReverseBotOptions): Promise<void> {
		this.config = options.config;
		this.credentials = options.credentials;
		this.callBacks = options.callBacks;
		this.symbol = this.getSymbol(
			options.config.baseCurrency,
			options.config.quoteCurrency,
		);

		await this.postSetConfiguration();

		this.callBacks.onStateUpdate(BotState.Initializing, this);

		const isSymbolExists = await this.isExistsSymbol(this.symbol);
		if (!isSymbolExists) {
			throw new BadRequestException(`Тикер ${this.symbol} не найден.`);
		}

		const snapshot = await this.createSnapshot();

		const coinBalance = snapshot.walletBalance.coins.find(
			(coin) => coin.coin === this.config.baseCurrency,
		);

		if (!coinBalance)
			throw new BadRequestException(
				`${this.config.baseCurrency} кошелека не найден`,
			);

		if (coinBalance.usdValue < this.minBaseWalletUsdValue)
			throw new BadRequestException(
				`В кошелке ${this.config.baseCurrency} меньше ${this.minBaseWalletUsdValue} USD`,
			);

		this.snapshots.start = snapshot;

		await this.init();

		this.callBacks.onStateUpdate(BotState.Running, this);
		this.checkBotStateTimer = setIntervalAsync(
			() => this.checkBotState(),
			1000,
		);
	}

	public async stop(): Promise<void> {
		if (this.state === BotState.Stopped) return;
		this.updateState(BotState.Stopped);

		try {
			this.callBacks.onStateUpdate(BotState.Stopping, this);

			if (this.checkBotStateTimer) {
				clearIntervalAsync(this.checkBotStateTimer);
			}

			this.snapshots.end = await this.createSnapshot();

			const foundBaseCoin = this.snapshots.end.walletBalance.coins.find(
				(coin) => coin.coin === this.config.baseCurrency,
			);

			await this.callWithRetry(() => this.cancelAllOrders());
			this.callWithRetry(() =>
				this.sellAllBoughtCurrencies(foundBaseCoin?.balance),
			)
				.catch((err) => {
					this.logger.error(
						'Error while sellong bought currencies',
						err,
					);
				})
				.finally(() => {
					this.callBacks.onStateUpdate(BotState.Stopped, this);
				});
		} catch (err) {
			this.logger.error('error while stopping bot', err);
		} finally {
			setTimeout(() => this.cleanUp(), 10_000);
		}
	}

	protected updateState(newState: TradingBotState) {
		this.state = newState;
	}

	protected getCustomOrderId(
		prefix: OrderCreationType,
		price: number,
	): string {
		return `${prefix}-${price}-${Date.now()}`;
	}

	protected parseCustomOrderId(
		orderId: string,
	): { prefix: OrderCreationType; price: number } | null {
		if (!orderId) return null;

		const [prefix, triggerPriceStr] = orderId.split('-');
		if (!prefix || !triggerPriceStr) return null;

		const triggerPrice = Number(triggerPriceStr);
		if (isNaN(triggerPrice)) return null;

		return {
			prefix: prefix as OrderCreationType,
			price: triggerPrice,
		};
	}

	protected async handleNewFilledOrder(rawOrder: any) {
		const order = this.parseIncomingOrder(rawOrder);
		if (order.symbol !== this.symbol) return;

		const parsedCustomOrderId = this.parseCustomOrderId(order.customId);
		if (!parsedCustomOrderId) return;

		const { prefix, price: triggerPrice } = parsedCustomOrderId;

		order.fee =
			order.feeCurrency.toUpperCase() ===
			this.config.quoteCurrency.toUpperCase()
				? Number(order.fee)
				: Number(order.fee) * Number(order.avgPrice);
		order.feeCurrency = this.config.quoteCurrency.toUpperCase();

		if (prefix === OrderCreationType.SELL_ALL) this.cleanUp();
		else if (this.state !== BotState.Running) return;
		else if (
			prefix === OrderCreationType.BUY_TRIGGER ||
			prefix === OrderCreationType.STOP_LOSS ||
			prefix === OrderCreationType.FIRST_BUY
		) {
			const newOrders: CreateTradingBotOrder[] = [];

			if (order.side === OrderSide.BUY) {
				newOrders.push({
					type: 'stop-loss',
					triggerPrice: triggerPrice - this.config.gridStep,
					quantity: order.quantity,
					customId: this.getCustomOrderId(
						OrderCreationType.STOP_LOSS,
						triggerPrice - this.config.gridStep,
					),
					side: OrderSide.SELL,
					symbol: this.symbol,
				});

				let maxTriggerPrice =
					triggerPrice +
					this.config.gridStep * this.gridConfig.atLeastBuyCount;

				while (this.triggerPrices.maxPrice < maxTriggerPrice) {
					const newTriggerPrice =
						this.triggerPrices.maxPrice + this.config.gridStep;

					newOrders.push({
						type: 'stop-order',
						side: OrderSide.BUY,
						triggerPrice: newTriggerPrice,
						quantity: order.quantity,
						customId: this.getCustomOrderId(
							OrderCreationType.BUY_TRIGGER,
							newTriggerPrice,
						),
						symbol: this.symbol,
					});

					this.updateTriggerPrices(newTriggerPrice);
				}
			} else {
				const newTriggerPrice = triggerPrice + this.config.gridStep;

				newOrders.push({
					type: 'stop-order',
					side: OrderSide.BUY,
					triggerPrice: newTriggerPrice,
					quantity: order.quantity,
					customId: this.getCustomOrderId(
						OrderCreationType.BUY_TRIGGER,
						newTriggerPrice,
					),
					symbol: this.symbol,
				});

				this.updateTriggerPrices(newTriggerPrice);
			}

			this.submitManyOrders(newOrders);
		}

		this.addNewOrder(order);
		this.callBacks.onNewOrder(order, triggerPrice, this.orders);
	}

	protected updateLastPrice(lastPrice: number) {
		this.marketData.lastPrice = lastPrice;
		this.checkAndCreateBuyOrders(lastPrice);
	}

	private async checkAndCreateBuyOrders(lastPrice: number) {
		if (this.isCheckingLastPrice || this.state !== BotState.Running) return;
		this.isCheckingLastPrice = true;

		const orders: CreateTradingBotOrder[] = [];

		while (
			this.triggerPrices.minPrice >=
			lastPrice + this.config.gridStep * 2
		) {
			const newTriggerPrice =
				this.triggerPrices.minPrice - this.config.gridStep;

			orders.push({
				side: OrderSide.BUY,
				triggerPrice: newTriggerPrice,
				type: 'stop-order',
				customId: this.getCustomOrderId(
					OrderCreationType.BUY_TRIGGER,
					newTriggerPrice,
				),
				quantity: this.config.gridVolume,
				symbol: this.symbol,
			});

			this.updateTriggerPrices(newTriggerPrice);
		}

		if (orders.length) {
			await this.submitManyOrders(orders);
		}

		this.isCheckingLastPrice = false;
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

	private async sellAllBoughtCurrencies(maxPrice?: number) {
		let allQuantity = 0;
		for (const order of this.orders) {
			if (order.side === OrderSide.BUY) allQuantity += order.quantity;
			else allQuantity -= order.quantity;
		}

		if (maxPrice && allQuantity > maxPrice) allQuantity = maxPrice;

		if (allQuantity > 0) {
			await this.submitOrder({
				customId: this.getCustomOrderId(OrderCreationType.SELL_ALL, 0),
				quantity: allQuantity,
				side: OrderSide.SELL,
				symbol: this.symbol,
				type: 'order',
			});
		}
	}

	protected addNewOrder(order: TradingBotOrder) {
		this.orders.push(order);
		const buyOrdersInSeries = this.getBoughtCountInSeries();
		if (this.config.takeProfitOnGrid <= buyOrdersInSeries) {
			this.stop();
		}
	}

	protected async makeFirstOrder() {
		if (this.isMadeFirstOrder) return;
		this.isMadeFirstOrder = true;

		if (this.state !== BotState.Idle) return;

		try {
			const startPrice = await this.getTickerLastPrice(this.symbol);
			this.updateTriggerPrices(startPrice);
			this.updateState(BotState.Running);

			await this.submitOrder({
				side: OrderSide.BUY,
				customId: this.getCustomOrderId(
					OrderCreationType.FIRST_BUY,
					startPrice,
				),
				type: 'order',
				quantity: this.config.gridVolume,
				symbol: this.symbol,
			});
		} catch (err) {
			this.logger.error('ERROR while makeFirstOrders', err);
		}
	}
	private async callWithRetry(
		callback: () => Promise<void>,
		attempts = this.requestConfig.defaultAttempts,
	): Promise<boolean> {
		while (attempts > 0) {
			try {
				await callback();
				return true;
			} catch (error) {
				this.logger.error(
					`Error callWithRetry, attempts left: ${attempts - 1}`,
					error,
				);
				attempts -= 1;
				if (attempts === 0) return false;

				await sleep(1000); // delay before retry
			}
		}

		return false;
	}

	private async submitManyOrders(orders: CreateTradingBotOrder[]) {
		if (orders.length === 0) return;

		const rawOrders = orders.map(this.getCreateOrderParams);

		await this.callWithRetry(() =>
			this.submitManyOrdersImpl(rawOrders),
		).then((res) => {
			if (res) {
				this.logger.info('Orders placed successfully', orders);
			}
		});
	}

	private async submitOrder(order: CreateTradingBotOrder) {
		const rawOrder = this.getCreateOrderParams(order);

		await this.callWithRetry(() => this.submitOrderImpl(rawOrder)).then(
			(res) => {
				if (res) {
					this.logger.info('Order placed successfully', order);
				}
			},
		);
	}

	protected async createSnapshot(): Promise<TradingBotSnapshot> {
		const currentPrice = await this.getTickerLastPrice(this.symbol);
		const walletBalance = await this.getWalletBalance();

		return {
			currentPrice: currentPrice,
			datetime: new Date(),
			walletBalance,
		};
	}

	private getBoughtCountInSeries() {
		let buyCount = this.orders.filter(
			(order) => order.side === OrderSide.BUY,
		).length;

		let sellCount = this.orders.length - buyCount;

		return buyCount - sellCount;
	}

	private async checkBotState() {
		const state = await this.callBacks.checkBotState();
		if (state === BotState.Stopped || state === BotState.Stopping) {
			await this.stop();
		}
	}

	public getSnapshots() {
		return this.snapshots;
	}

	// init should call makeFirstOrder
	protected abstract init(): Promise<void>;
	protected abstract postSetConfiguration(): Promise<void>;
	protected abstract cancelAllOrders(): Promise<void>;
	protected abstract cleanUp(): Promise<void>;

	protected abstract isExistsSymbol(symbol: string): Promise<boolean>;
	protected abstract getTickerLastPrice(ticker: string): Promise<number>;
	protected abstract getWalletBalance(): Promise<WalletBalance>;

	protected abstract submitOrderImpl(orderParams: any): Promise<void>;
	protected abstract submitManyOrdersImpl(ordersParams: any[]): Promise<void>;

	protected abstract getCreateOrderParams(order: CreateTradingBotOrder): any;
	protected abstract parseIncomingOrder(order: any): TradingBotOrder;

	protected abstract getSymbol(
		baseCurrency: string,
		quoteCurrency: string,
	): string;
}
