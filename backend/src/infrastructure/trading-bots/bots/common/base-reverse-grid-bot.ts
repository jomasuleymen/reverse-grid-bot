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
import { calculateOrdersPnL } from '@/infrastructure/utils/trading-orders.util';
import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
import sleep from 'sleep-promise';
import { TradingBotOrdersService } from '../../trading-bot-orders.service';
import { BaseTradingBot } from './base-trading-bot';

@Injectable({ scope: Scope.TRANSIENT })
export abstract class BaseReverseGridBot
	extends BaseTradingBot
	implements ITradingBot
{
	protected config: ITradingBotConfig;
	protected credentials: IExchangeCredentials;

	private state: BotState = BotState.Idle;
	private readonly orders: TradingBotOrder[] = [];
	private readonly snapshots: {
		start?: TradingBotSnapshot;
		end?: TradingBotSnapshot;
	} = {};
	private onStateUpdate: (newStatus: BotState) => void;

	private readonly minBaseWalletUsdValue = 10;
	private readonly requestConfig = {
		maxAttempts: 3,
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

	@Inject(TradingBotOrdersService)
	private readonly botOrdersService: TradingBotOrdersService;

	// Processes state
	private isCheckingLastPrice: boolean = false;
	private isMadeFirstOrder: boolean = false;

	public async start(options: IStartReverseBotOptions): Promise<void> {
		this.userId = options.userId;
		this.botId = options.botId;
		this.config = options.config;
		this.credentials = options.credentials;
		this.onStateUpdate = options.onStateUpdate;

		await this.postSetConfiguration();

		const isSymbolExists = await this.isExistsSymbol(this.config.symbol);
		if (!isSymbolExists) {
			throw new BadRequestException(
				`Тикер ${this.config.symbol} не найден.`,
			);
		}

		this.updateState(BotState.Initializing);

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

		await this.sendMessage(this.getSnapshotMessage(this.snapshots.start));

		await this.init();
	}

	public async stop(): Promise<void> {
		if (this.state === BotState.Stopped || this.state === BotState.Stopping)
			return;

		this.updateState(BotState.Stopping);

		this.snapshots.end = await this.createSnapshot();

		await this.cancelAllOrders();
		await this.sellAllBoughtCurrencies().then((res) => {
			setTimeout(this.cleanUp, 10_000);
		});

		await this.sendMessage(
			`------ Открытие ------\n\n` +
				this.getSnapshotMessage(this.snapshots.start!) +
				'\n\n' +
				`------ Закрытие ------\n\n` +
				this.getSnapshotMessage(this.snapshots.end!),
		);

		this.updateState(BotState.Stopped);
	}

	protected updateState(newState: BotState) {
		this.state = newState;
		this.onStateUpdate?.(newState);
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
		// if (this.state !== BotState.Running) return;
		const order = this.parseIncomingOrder(rawOrder);
		const parsedCustomOrderId = this.parseCustomOrderId(order.customId);
		if (!parsedCustomOrderId) return;

		const { prefix, price: triggerPrice } = parsedCustomOrderId;

		order.fee =
			order.feeCurrency.toUpperCase() ===
			this.config.quoteCurrency.toUpperCase()
				? Number(order.fee)
				: Number(order.fee) * Number(order.avgPrice);
		order.feeCurrency = this.config.quoteCurrency.toUpperCase();

		if (prefix === OrderCreationType.SELL_ALL) {
			this.cleanUp();
		}

		if (
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
					symbol: this.config.symbol,
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
						symbol: this.config.symbol,
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
					symbol: this.config.symbol,
				});

				this.updateTriggerPrices(newTriggerPrice);
			}

			this.submitManyOrders(newOrders);
		}

		this.addNewOrder(order).then(() => {
			const buyOrdersInSeries = this.getBoughtCountInSeries();
			if (this.config.takeProfitOnGrid <= buyOrdersInSeries) {
				this.stop();
			}

			this.sendNewOrderSummary(order, triggerPrice);
		});
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
				symbol: this.config.symbol,
			});

			this.updateTriggerPrices(newTriggerPrice);
		}

		if (orders.length) {
			await this.submitManyOrders(orders);
		}

		this.isCheckingLastPrice = false;
	}

	private async sendNewOrderSummary(
		order: TradingBotOrder,
		triggerPrice: number,
	) {
		const sellCount = this.orders.filter(
			(o) => o.side === OrderSide.SELL,
		).length;
		const buyCount = this.orders.length - sellCount;

		const pnl = calculateOrdersPnL(this.orders, this.marketData.lastPrice);

		const message = `BYBIT
		📈 **Информация об ордере**
		- Сторона: ${order.side}
		- Триггерная цена: ${triggerPrice}
		- Покупная цена: ${order.avgPrice}
		💰 **Доходность**
		- Реализованная прибыль: ${pnl.realizedPnL.toFixed(2)}
		- Нереализованная прибыль: ${pnl.unrealizedPnL.toFixed(2)}
		- Прибыль: ${pnl.PnL.toFixed(2)}
		📊 **Текущая торговая статистика**
		- Текущая цена: ${this.marketData.lastPrice.toFixed(2)}
		🔄 **Общее количество операций**
		- Покупки: ${buyCount}
		- Продажи: ${sellCount}`;

		this.sendMessage(message);
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

	private async sellAllBoughtCurrencies() {
		let allQuantity = 0;
		for (const order of this.orders) {
			if (order.side === OrderSide.BUY) allQuantity += order.quantity;
			else allQuantity -= order.quantity;
		}

		if (allQuantity > 0) {
			await this.submitOrder({
				customId: this.getCustomOrderId(OrderCreationType.SELL_ALL, 0),
				quantity: allQuantity,
				side: OrderSide.SELL,
				symbol: this.config.symbol,
				type: 'order',
			});
		}
	}

	protected async addNewOrder(order: TradingBotOrder) {
		this.orders.push(order);

		await this.botOrdersService.save(this.botId, {
			orderId: order.id,
			avgPrice: order.avgPrice,
			customId: order.customId,
			fee: order.fee,
			feeCurrency: order.feeCurrency,
			quantity: order.quantity,
			side: order.side,
			symbol: order.symbol,
			createdDate: order.createdDate,
		});
	}

	private getSnapshotMessage(snapshot: TradingBotSnapshot): string {
		if (!snapshot?.walletBalance) return 'Нету данные';

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
				timeZone: 'Asia/Almaty',
			})}`
		);
	}

	protected async makeFirstOrder() {
		if (this.isMadeFirstOrder) return;
		this.isMadeFirstOrder = true;

		if (
			this.state !== BotState.Idle &&
			this.state !== BotState.Initializing
		)
			return;

		try {
			const startPrice = await this.getTickerLastPrice(
				this.config.symbol,
			);
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
				symbol: this.config.symbol,
			});
		} catch (err) {
			console.log('ERROR while makeFirstOrders', err);
		}
	}
	private async retrySubmitOrders(
		submitOrderCallback: () => Promise<void>,
		attempts = this.requestConfig.maxAttempts,
	) {
		while (attempts > 0) {
			try {
				await submitOrderCallback();
				return;
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
				await sleep(1000); // delay before retry
			}
		}
	}

	private async submitManyOrders(orders: CreateTradingBotOrder[]) {
		if (orders.length === 0) return;

		const rawOrders = orders.map(this.getCreateOrderParams);

		await this.retrySubmitOrders(() =>
			this.submitManyOrdersImpl(rawOrders),
		);
	}

	private async submitOrder(order: CreateTradingBotOrder) {
		const rawOrder = this.getCreateOrderParams(order);

		await this.retrySubmitOrders(() => this.submitOrderImpl(rawOrder));
	}

	protected async createSnapshot(): Promise<TradingBotSnapshot> {
		const currentPrice = await this.getTickerLastPrice(this.config.symbol);
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
}
