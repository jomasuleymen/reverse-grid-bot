import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import {
	BotState,
	CreateTradingBotOrder,
	IExchangeCredentials,
	IStartReverseBotOptions,
	ITradingBot,
	ITradingBotConfig,
	OrderCreationType,
	TradePosition,
	TradingBotOrder,
	TradingBotSnapshot,
} from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { WalletBalance } from '@/domain/interfaces/trading-bots/wallet.interface';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { retryWithFallback } from '@/infrastructure/utils/request.utils';
import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
import {
	clearIntervalAsync,
	setIntervalAsync,
	SetIntervalAsyncTimer,
} from 'set-interval-async';

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

	private readonly minCoinBalance = 10;

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

	private TRIGGER_SIDE: OrderSide = OrderSide.BUY;
	private STOP_LOSS_SIDE: OrderSide = OrderSide.SELL;

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

		if (this.config.position === TradePosition.SHORT) {
			this.TRIGGER_SIDE = OrderSide.SELL;
			this.STOP_LOSS_SIDE = OrderSide.BUY;
			this.config.gridStep *= -1;
		}

		await this.postSetConfiguration();

		this.callBacks.onStateUpdate(BotState.Initializing, this);

		const isSymbolExists = await this.isExistsSymbol(this.symbol);
		if (!isSymbolExists) {
			throw new BadRequestException(`Тикер ${this.symbol} не найден.`);
		}

		const snapshot = await this.createSnapshot();

		this.validateCoinBalance(
			snapshot.walletBalance,
			this.config.baseCurrency,
			this.minCoinBalance,
		);

		this.validateCoinBalance(
			snapshot.walletBalance,
			this.config.quoteCurrency,
			this.minCoinBalance,
		);

		this.snapshots.start = snapshot;

		await this.init();

		this.checkBotStateTimer = setIntervalAsync(
			() => this.checkBotState(),
			1000,
		);
	}

	private validateCoinBalance(
		walletBalance: WalletBalance,
		currency: string,
		minBalance: number,
	) {
		const coinBalance = walletBalance.coins.find(
			(coin) => coin.coin === currency,
		);

		if (!coinBalance)
			throw new BadRequestException(`${currency} кошелека не найден`);

		if (coinBalance.usdValue < minBalance)
			throw new BadRequestException(
				`В кошелке ${currency} меньше ${minBalance} USD`,
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

			await retryWithFallback(() => this.cancelAllOrders()).then(
				(res) => {
					if (res.success) {
						this.logger.info('Successfully cancelled all orders');
					} else {
						this.logger.error(`Can't cancell orders`, {
							error: res.error,
						});
					}
				},
			);

			this.snapshots.end = await this.createSnapshot();

			const foundBaseCoin = this.snapshots.end.walletBalance.coins.find(
				(coin) => coin.coin === this.config.baseCurrency,
			);

			this.closeAllPositions(foundBaseCoin?.balance).finally(() => {
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

		if (prefix === OrderCreationType.LAST_TRADE) this.cleanUp();
		else if (this.state !== BotState.Running) return;
		else if (
			prefix === OrderCreationType.TRIGGER ||
			prefix === OrderCreationType.STOP_LOSS ||
			prefix === OrderCreationType.FIRST_TRADE
		) {
			const newOrders: CreateTradingBotOrder[] = [];

			if (order.side === this.TRIGGER_SIDE) {
				newOrders.push({
					type: 'stop-loss',
					triggerPrice: triggerPrice - this.config.gridStep,
					quantity: order.quantity,
					customId: this.getCustomOrderId(
						OrderCreationType.STOP_LOSS,
						triggerPrice - this.config.gridStep,
					),
					side: this.STOP_LOSS_SIDE,
					symbol: this.symbol,
				});

				while (this.shouldCreateNextTrigger(triggerPrice)) {
					const nextTriggerPrice = this.getNextTriggerPrice();

					newOrders.push({
						type: 'stop-order',
						side: this.TRIGGER_SIDE,
						triggerPrice: nextTriggerPrice,
						quantity: order.quantity,
						customId: this.getCustomOrderId(
							OrderCreationType.TRIGGER,
							nextTriggerPrice,
						),
						symbol: this.symbol,
					});

					this.updateTriggerPrices(nextTriggerPrice);
				}
			} else {
				const newTriggerPrice = triggerPrice + this.config.gridStep;

				newOrders.push({
					type: 'stop-order',
					side: this.TRIGGER_SIDE,
					triggerPrice: newTriggerPrice,
					quantity: order.quantity,
					customId: this.getCustomOrderId(
						OrderCreationType.TRIGGER,
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

	private shouldCreateNextTrigger(triggerPrice: number): boolean {
		let triggerPriceEdge =
			triggerPrice +
			this.config.gridStep * this.gridConfig.atLeastBuyCount;

		if (this.config.position === TradePosition.SHORT) {
			return this.triggerPrices.minPrice > triggerPriceEdge;
		}

		return this.triggerPrices.maxPrice < triggerPriceEdge;
	}

	private getNextTriggerPrice() {
		let edgePrice =
			this.config.position === TradePosition.SHORT
				? this.triggerPrices.minPrice
				: this.triggerPrices.maxPrice;

		return edgePrice + this.config.gridStep;
	}

	private shouldCreateMissedTrigger(lastPrice: number): boolean {
		if (this.config.position === TradePosition.SHORT) {
			return (
				lastPrice >=
				this.triggerPrices.maxPrice - this.config.gridStep * 2
			);
		}

		return (
			this.triggerPrices.minPrice >= lastPrice + this.config.gridStep * 2
		);
	}

	private getMissedTriggerPrice() {
		let edgePrice =
			this.config.position === TradePosition.SHORT
				? this.triggerPrices.maxPrice
				: this.triggerPrices.minPrice;

		return edgePrice - this.config.gridStep;
	}

	protected updateLastPrice(lastPrice: number) {
		this.marketData.lastPrice = lastPrice;
		this.checkMissedTriggers(lastPrice);
	}

	private async checkMissedTriggers(lastPrice: number) {
		if (this.isCheckingLastPrice || this.state !== BotState.Running) return;
		this.isCheckingLastPrice = true;

		const orders: CreateTradingBotOrder[] = [];

		while (this.shouldCreateMissedTrigger(lastPrice)) {
			const missedTriggerPrice = this.getMissedTriggerPrice();

			orders.push({
				side: this.TRIGGER_SIDE,
				triggerPrice: missedTriggerPrice,
				type: 'stop-order',
				customId: this.getCustomOrderId(
					OrderCreationType.TRIGGER,
					missedTriggerPrice,
				),
				quantity: this.config.gridVolume,
				symbol: this.symbol,
			});

			this.updateTriggerPrices(missedTriggerPrice);
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

	private async closeAllPositions(maxQuantity?: number) {
		let allQuantity = 0;
		for (const order of this.orders) {
			if (order.side === this.TRIGGER_SIDE) allQuantity += order.quantity;
			else allQuantity -= order.quantity;
		}

		if (maxQuantity && allQuantity > maxQuantity) allQuantity = maxQuantity;

		if (allQuantity > 0) {
			await this.submitOrder({
				customId: this.getCustomOrderId(
					OrderCreationType.LAST_TRADE,
					0,
				),
				quantity: allQuantity,
				side: this.STOP_LOSS_SIDE,
				symbol: this.symbol,
				type: 'order',
			}).then((res) => {
				if (res.success) {
					this.logger.info('Successfully closed all positions');
					console.log(res.data);
				} else {
					this.logger.error('Error while sellong bought currencies', {
						error: res.error,
					});
				}
			});
		}
	}

	protected addNewOrder(order: TradingBotOrder) {
		this.orders.push(order);
		const buyOrdersInSeries = this.getStopLossCount();
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
				side: this.TRIGGER_SIDE,
				customId: this.getCustomOrderId(
					OrderCreationType.FIRST_TRADE,
					startPrice,
				),
				type: 'order',
				quantity: this.config.gridVolume,
				symbol: this.symbol,
			}).then((res) => {
				if (res.success) {
					this.callBacks.onStateUpdate(BotState.Running, this);
				} else {
					this.stop();
				}
			});
		} catch (err) {
			this.logger.error('ERROR while makeFirstOrders', err);
		}
	}

	private async submitManyOrders(orders: CreateTradingBotOrder[]) {
		if (orders.length === 0) return;

		const rawOrders = orders.map(this.getCreateOrderParams);

		await retryWithFallback(() =>
			this.submitManyOrdersImpl(rawOrders),
		).then((res) => {
			if (res.success) {
				this.logger.info('Orders placed successfully', orders);
			} else {
				this.logger.error(`Orders can't placed`, {
					orders,
					error: res.error,
				});
			}
		});
	}

	private async submitOrder(order: CreateTradingBotOrder) {
		const rawOrder = this.getCreateOrderParams(order);

		return await retryWithFallback(() =>
			this.submitOrderImpl(rawOrder),
		).then((res) => {
			if (res.success) {
				this.logger.info('Order placed successfully', order);
			} else {
				this.logger.error(`Order can't placed`, {
					order,
					error: res.error,
				});
			}

			return res;
		});
	}

	protected async createSnapshot(): Promise<TradingBotSnapshot> {
		const [currentPrice, walletBalance] = await Promise.all([
			this.getTickerLastPrice(this.symbol),
			this.getWalletBalance(),
		]);

		return {
			currentPrice: currentPrice,
			datetime: new Date(),
			walletBalance,
		};
	}

	private getStopLossCount() {
		let buyCount = this.orders.filter(
			(order) => order.side === this.TRIGGER_SIDE,
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
