import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import { IProxy } from '@/domain/interfaces/proxy.interface';
import {
	BotState,
	CreateTradingBotOrder,
	CreateTradingBotStopOrder,
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
import { ExchangesService } from '@/infrastructure/exchanges/exchanges.service';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { FallbackResult } from '@/infrastructure/utils/request.utils';
import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
import { generateNewOrderId } from 'binance';
import sleep from 'sleep-promise';
import { TradingBotEntity } from '../../entities/trading-bots.entity';

type TradingBotState = BotState.Idle | BotState.Running | BotState.Stopped;

@Injectable({ scope: Scope.TRANSIENT })
export abstract class BaseReverseGridBot implements ITradingBot {
	protected config: ITradingBotConfig;
	protected proxy?: IProxy;
	protected credentials: IExchangeCredentials;
	protected symbol: string;

	protected startPrice: number;

	@Inject(LoggerService)
	protected readonly logger: LoggerService;

	@Inject(ExchangesService)
	protected readonly exchangesService: ExchangesService;

	private state: TradingBotState = BotState.Idle;
	private readonly orders: TradingBotOrder[] = [];
	private readonly snapshots: {
		start?: TradingBotSnapshot;
		end?: TradingBotSnapshot;
	} = {};

	private callBacks: IStartReverseBotOptions['callBacks'];

	protected readonly marketData = {
		currentPrice: 0,
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

	private customOrderIdsMap: Record<
		string,
		{ type: OrderCreationType; price: number }
	> = {};

	private isMadeFirstOrder: boolean = false;
	private isCleanedUp: boolean = false;

	public async start(options: IStartReverseBotOptions): Promise<void> {
		this.config = options.config;
		this.proxy = options.proxy;
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

		this.startPrice = await this.getTickerPrice(this.symbol).catch(
			(err) => {
				throw new Error(err?.message || 'Произошла неизвестная ошибка');
			},
		);

		const snapshot = await this.createSnapshot();

		this.validateCurrencyBalance(
			snapshot.walletBalance,
			this.config.baseCurrency,
		);

		this.validateCurrencyBalance(
			snapshot.walletBalance,
			this.config.quoteCurrency,
		);

		this.snapshots.start = snapshot;

		this.callBacks.onStateUpdate(BotState.Initializing);

		await this.init();

		this.checkBotState();
		this.checkMissedTriggers();
	}

	protected async successInit() {
		if (this.config.tradeOnStart) {
			return this.makeFirstOrder();
		} else if (this.config.triggerPrice) {
			this.callBacks.onStateUpdate(BotState.WaitingForTriggerPrice);
			await this.waitForTriggerPrice();
			return this.makeFirstOrder();
		}

		this.initiateTrading(this.startPrice);

		const triggerOrders = this.getMissedTriggerSideOrders(this.startPrice);
		const triggerPrices = triggerOrders.map((o) => o.triggerPrice);
		this.triggerPrices.minPrice = Math.min(...triggerPrices);
		this.triggerPrices.maxPrice = Math.max(...triggerPrices);

		this.submitOrders(triggerOrders).then((res) => {
			if (res.ok) {
				this.callBacks.onStateUpdate(BotState.Running, {
					snapshots: this.snapshots,
				});
			} else {
				this.stop({ isError: true, reason: res.message });
			}
		});
	}

	private validateCurrencyBalance(
		walletBalance: WalletBalance,
		currency: string,
	) {
		const coinBalance = walletBalance.coins.find(
			(coin) => coin.coin === currency,
		);

		if (!coinBalance)
			throw new BadRequestException(`${currency} кошелека не найден`);
	}

	public async stop(options?: {
		isError?: boolean;
		reason?: string;
	}): Promise<void> {
		if (this.state === BotState.Stopped) return;
		this.updateState(BotState.Stopped);

		try {
			this.callBacks.onStateUpdate(
				options?.isError ? BotState.Errored : BotState.Stopping,
				{ stoppedReason: options?.reason },
			);

			await this.cancelAllOrders()
				.then((res) => {
					this.logger.info('Successfully cancelled all orders', res);
				})
				.catch((err) => {
					this.logger.error(`Can't cancell orders`, err);
				});

			this.snapshots.end = await this.createSnapshot();
		} catch (err) {
			this.logger.error('error while stopping bot', err);
		} finally {
			// let allQuantity: number | undefined = 0;
			// if (this.snapshots.end?.walletBalance) {
			// 	const foundCoin = this.snapshots.end.walletBalance.coins.find(
			// 		(coin) => coin.coin === this.config.baseCurrency,
			// 	);

			// 	allQuantity = foundCoin?.balance;
			// }

			const sentLastTrade = await this.closeAllPositions().catch(
				() => false,
			);
			if (sentLastTrade) {
				setTimeout(() => this.cleanUp(), 10_000);
			} else {
				this.cleanUp();
			}
		}
	}

	private async cleanUp() {
		if (this.isCleanedUp) return;
		this.isCleanedUp = true;

		this.callBacks.onStateUpdate(BotState.Stopped, {
			snapshots: this.snapshots,
		});

		this.cleanUpImpl().catch((err) => {
			this.logger.error('Error while cleaning up', err);
		});
	}

	private updateState(newState: TradingBotState) {
		this.state = newState;
	}

	protected getCustomOrderId(type: OrderCreationType, price: number): string {
		const customOrderId = generateNewOrderId('spot');
		this.customOrderIdsMap[customOrderId] = {
			price,
			type,
		};
		return customOrderId;
	}

	protected parseCustomOrderId(
		orderId: string,
	): { type: OrderCreationType; price: number } | null {
		if (!orderId) return null;

		const data = this.customOrderIdsMap[orderId];
		if (!data) return null;

		return {
			type: data.type,
			price: data.price,
		};
	}

	protected async handleNewFilledOrder(order: TradingBotOrder) {
		const orderInfo = this.parseCustomOrderId(order.customId);
		if (!orderInfo) return;

		let { type, price: triggerPrice } = orderInfo;

		order.fee =
			order.feeCurrency.toUpperCase() ===
			this.config.quoteCurrency.toUpperCase()
				? Number(order.fee)
				: Number(order.fee) * Number(order.avgPrice);
		order.feeCurrency = this.config.quoteCurrency.toUpperCase();
		order.triggerPrice = triggerPrice;

		if (!triggerPrice) triggerPrice = order.avgPrice;

		if (type === OrderCreationType.LAST_TRADE) this.handleLastOrder(order);
		else if (
			this.state === BotState.Running ||
			this.state === BotState.Idle
		) {
			if (type === OrderCreationType.FIRST_TRADE) {
				triggerPrice = order.avgPrice;
				this.initiateTrading(triggerPrice);
			}

			if (
				type === OrderCreationType.TRIGGER ||
				type === OrderCreationType.STOP_LOSS ||
				type === OrderCreationType.FIRST_TRADE
			) {
				const newOrders: CreateTradingBotOrder[] = [];

				if (order.side === this.TRIGGER_SIDE) {
					const stopLoss = triggerPrice - this.config.gridStep;

					newOrders.push({
						type: 'stop-loss',
						triggerPrice: stopLoss,
						quantity: order.quantity,
						customId: this.getCustomOrderId(
							OrderCreationType.STOP_LOSS,
							stopLoss,
						),
						side: this.STOP_LOSS_SIDE,
						symbol: this.symbol,
					});

					const triggerOrders =
						this.getMissedTriggerSideOrders(triggerPrice);

					newOrders.push(...triggerOrders);
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

				this.submitOrders(newOrders);
			}
		}

		this.addNewOrder(order);
	}

	private async handleLastOrder(order: TradingBotOrder) {
		this.cleanUp();
	}

	private getMissedTriggerSideOrders(triggerPrice: number) {
		const orders: CreateTradingBotStopOrder[] = [];

		while (this.shouldCreateNextTrigger(triggerPrice)) {
			const nextTriggerPrice = this.getNextTriggerPrice();

			orders.push({
				type: 'stop-order',
				side: this.TRIGGER_SIDE,
				triggerPrice: nextTriggerPrice,
				quantity: this.config.gridVolume,
				customId: this.getCustomOrderId(
					OrderCreationType.TRIGGER,
					nextTriggerPrice,
				),
				symbol: this.symbol,
			});

			this.updateTriggerPrices(nextTriggerPrice);
		}

		return orders;
	}

	private initiateTrading(triggerPrice: number) {
		this.updateTriggerPrices(triggerPrice);
		this.updateState(BotState.Running);
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

	private async closeAllPositions() {
		let allQuantity = 0;
		for (const order of this.orders) {
			if (order.side == this.TRIGGER_SIDE) allQuantity += order.quantity;
			else allQuantity -= order.quantity;
		}

		this.logger.info('closeAllPositions', { allQuantity });
		allQuantity = Number((Number(allQuantity) + 1 - 1).toFixed(6));
		this.logger.info('closeAllPositions after normalize', { allQuantity });

		if (allQuantity > 0) {
			await this.submitOrders({
				customId: this.getCustomOrderId(
					OrderCreationType.LAST_TRADE,
					0,
				),
				quantity: allQuantity,
				side: this.STOP_LOSS_SIDE,
				symbol: this.symbol,
				type: 'order',
			}).then((res) => {
				if (res.ok) {
					this.logger.info(
						'Successfully closed all positions',
						res.data,
					);
				} else {
					this.logger.error(
						'Error while sellong bought currencies',
						res.error,
					);
				}
			});

			return true;
		}

		return false;
	}

	protected addNewOrder(order: TradingBotOrder) {
		this.orders.push(order);
		this.callBacks.onNewOrder(order);

		const stopLossCount = this.getStopLossCount();
		if (
			this.config.takeProfitOnGrid &&
			this.config.takeProfitOnGrid <= stopLossCount
		) {
			this.stop({ reason: 'Тейк-профит на сетке' });
		}
	}

	private async waitForTriggerPrice() {
		while (
			this.state === BotState.Idle &&
			this.config.triggerPrice &&
			((this.config.position === TradePosition.LONG &&
				this.config.triggerPrice > this.marketData.currentPrice) ||
				(this.config.position === TradePosition.SHORT &&
					this.config.triggerPrice < this.marketData.currentPrice))
		) {
			await sleep(100);
		}
	}

	protected async makeFirstOrder() {
		if (this.isMadeFirstOrder || this.state !== BotState.Idle) return;
		this.isMadeFirstOrder = true;

		await this.submitOrders({
			side: this.TRIGGER_SIDE,
			customId: this.getCustomOrderId(
				OrderCreationType.FIRST_TRADE,
				this.config.triggerPrice || 0,
			),
			type: 'order',
			quantity: this.config.gridVolume,
			symbol: this.symbol,
		}).then((res) => {
			if (res.ok) {
				this.callBacks.onStateUpdate(BotState.Running, {
					snapshots: this.snapshots,
				});
			} else {
				this.stop({ isError: true, reason: res.message });
			}
		});
	}

	private async submitOrders(
		orders: CreateTradingBotOrder | CreateTradingBotOrder[],
	): Promise<FallbackResult> {
		const ordersArr = Array.isArray(orders) ? orders : [orders];

		if (ordersArr.length === 0) return { ok: true, data: {} };

		try {
			const res = await this.submitOrdersImpl(ordersArr);

			if (res.ok) {
				this.logger.info('Orders placed successfully', {
					orders,
					response: res,
				});
				return { ok: true, data: res.data };
			}

			this.logger.error('Failed to place orders', {
				orders,
				error: res.error,
			});
			return { ok: false, message: res.message, error: res.error };
		} catch (error: any) {
			this.logger.error('Failed to place orders', { orders, error });
			return { ok: false, message: error.message, error };
		}
	}

	protected async createSnapshot(): Promise<TradingBotSnapshot> {
		const walletBalance = await this.getWalletBalance().catch((err) =>
			this.exchangesService.emptyWalletBalance(),
		);

		return {
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

	private async checkMissedTriggers() {
		while (this.state === BotState.Idle) {
			await sleep(100);
		}

		while (this.state === BotState.Running) {
			const orders: CreateTradingBotOrder[] = [];

			while (
				this.marketData.currentPrice &&
				this.shouldCreateMissedTrigger(this.marketData.currentPrice)
			) {
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
				this.submitOrders(orders);
			}

			await sleep(50);
		}
	}

	private isTakeProfitTriggered() {
		if (!this.config.takeProfit || !this.marketData.currentPrice)
			return false;

		return this.config.position === TradePosition.LONG
			? this.marketData.currentPrice >= this.config.takeProfit
			: this.marketData.currentPrice <= this.config.takeProfit;
	}

	private async checkBotState() {
		while (true) {
			if (
				this.state === BotState.Running &&
				this.isTakeProfitTriggered()
			) {
				this.stop({ reason: 'Тейк-профит' });
				return;
			}

			const botConfig = await this.callBacks.getBotConfig();
			if (
				botConfig.state === BotState.Stopped ||
				botConfig.state === BotState.Stopping
			) {
				this.stop({ reason: 'Ручная остановка' });
				return;
			}

			this.checkBotConfigForUpdates(botConfig);

			await sleep(150);
		}
	}

	private checkBotConfigForUpdates(botEntity: TradingBotEntity) {
		if (botEntity.gridStep !== Math.abs(this.config.gridStep)) {
			this.config.gridStep =
				this.config.position === TradePosition.SHORT
					? -botEntity.gridStep
					: botEntity.gridStep;
		}

		if (botEntity.gridVolume !== this.config.gridVolume) {
			this.config.gridVolume = botEntity.gridVolume;
		}

		if (botEntity.takeProfit !== this.config.takeProfit) {
			this.config.takeProfit = botEntity.takeProfit;
		}

		if (botEntity.takeProfitOnGrid !== this.config.takeProfitOnGrid) {
			this.config.takeProfitOnGrid = botEntity.takeProfitOnGrid;
		}

		if (botEntity.triggerPrice !== this.config.triggerPrice) {
			this.config.triggerPrice = botEntity.triggerPrice;
		}
	}

	public getSnapshots() {
		return this.snapshots;
	}

	// Called on start method
	// init should call makeFirstOrder
	protected abstract init(): Promise<void>;
	protected abstract postSetConfiguration(): Promise<void>;

	// Called on stop method
	protected abstract cancelAllOrders(): Promise<any>;
	protected abstract cleanUpImpl(): Promise<void>;

	protected abstract getTickerPrice(ticker: string): Promise<number>;
	protected abstract getWalletBalance(): Promise<WalletBalance>;

	protected abstract submitOrdersImpl(
		ordersParams: CreateTradingBotOrder[],
	): Promise<FallbackResult>;

	protected abstract getSymbol(
		baseCurrency: string,
		quoteCurrency: string,
	): string;
}
