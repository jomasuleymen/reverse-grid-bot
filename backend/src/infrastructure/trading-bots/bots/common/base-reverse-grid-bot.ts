import {
	BotState,
	CreateTradingBotOrder,
	ExchangeCredentialsType,
	IExchangeCredentials,
	IStartReverseBotOptions,
	ITradingBot,
	ITradingBotConfig,
	TradingBotOrder,
	TradingBotSnapshot,
} from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import TelegramService from '@/infrastructure/services/telegram/telegram.service';
import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
import sleep from 'sleep-promise';

@Injectable({ scope: Scope.TRANSIENT })
export abstract class BaseReverseGridBot implements ITradingBot {
	protected readonly orders: TradingBotOrder[] = [];
	protected config: ITradingBotConfig;
	protected state: BotState = BotState.Idle;
	protected credentials: IExchangeCredentials;
	protected userId: number;
	protected isTestnet: boolean;
	private onStateUpdate: (newStatus: BotState) => void;
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

	protected isCheckingLastPrice: boolean = false;

	@Inject(TelegramService)
	private readonly telegramService: TelegramService;

	protected readonly snapshots: {
		start?: TradingBotSnapshot;
		end?: TradingBotSnapshot;
	} = {};

	protected async sendMessage(message: string) {
		this.telegramService.sendMessage(this.userId, message);
	}

	protected getCustomOrderId(prefix: string, price: number): string {
		return `${prefix}_${price}_${Date.now()}`;
	}

	protected getPriceFromCustomOrderId(orderId: string): number | null {
		if (!orderId) return null;

		const [side, triggerPriceStr] = orderId.split('_');
		if (!triggerPriceStr) return null;

		return Number(triggerPriceStr) || null;
	}

	protected updateState(newState: BotState) {
		this.state = newState;
		if (this.onStateUpdate) {
			this.onStateUpdate(newState);
		}
	}

	protected async handleNewFilledOrder(rawOrder: any) {
		if (this.state !== BotState.Running) return;
		const order = this.parseIncomingOrder(rawOrder);

		const triggerPrice = this.getPriceFromCustomOrderId(order.customId);
		if (!triggerPrice) return;

		order.fee =
			order.feeCurrency === this.config.quoteCurrency
				? Number(order.fee)
				: Number(order.fee) * Number(order.avgPrice);

		const orders: CreateTradingBotOrder[] = [];

		this.addNewOrder(order);

		if (order.side === 'buy') {
			orders.push({
				type: 'stop-loss',
				price: triggerPrice - this.config.gridStep,
				quantity: order.quantity,
				customId: this.getCustomOrderId(
					'SL',
					triggerPrice - this.config.gridStep,
				),
				side: 'sell',
				symbol: this.config.symbol,
			});

			let maxTriggerPrice =
				triggerPrice +
				this.config.gridStep * this.gridConfig.atLeastBuyCount;

			while (this.triggerPrices.maxPrice < maxTriggerPrice) {
				const newTriggerPrice =
					this.triggerPrices.maxPrice + this.config.gridStep;

				orders.push({
					type: 'stop-order',
					side: 'buy',
					price: newTriggerPrice,
					quantity: order.quantity,
					customId: this.getCustomOrderId('SO-buy', newTriggerPrice),
					symbol: this.config.symbol,
				});

				this.updateTriggerPrices(newTriggerPrice);
			}
		} else {
			const newTriggerPrice = triggerPrice + this.config.gridStep;

			orders.push({
				type: 'stop-order',
				side: 'buy',
				price: newTriggerPrice,
				quantity: order.quantity,
				customId: this.getCustomOrderId('SO-buy', newTriggerPrice),
				symbol: this.config.symbol,
			});

			this.updateTriggerPrices(newTriggerPrice);
		}

		this.submitManyOrders(orders);
		this.sendNewOrderSummary(order, triggerPrice);
	}

	protected updateLastPrice(lastPrice: number) {
		this.marketData.lastPrice = lastPrice;
		this.checkPriceLowering(lastPrice);
	}

	private async checkPriceLowering(lastPrice: number) {
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
				side: 'buy',
				price: newTriggerPrice,
				type: 'stop-order',
				customId: this.getCustomOrderId('SO-buy', newTriggerPrice),
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
		const sellCount = this.orders.filter((o) => o.side === 'sell').length;
		const buyCount = this.orders.length - sellCount;
		// if (buyCount - sellCount >= this.tradeConfig.cancelOnBuyCount) {
		// 	this.stopProcess();
		// } else if (orders.length) {
		const pnl = this.calculatePnL(this.marketData.lastPrice);
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

	public async start(options: IStartReverseBotOptions): Promise<void> {
		this.userId = options.userId;
		this.config = options.config;
		this.credentials = options.credentials;
		this.isTestnet =
			this.credentials.type == ExchangeCredentialsType.Testnet;

		this.onStateUpdate = options.onStateUpdate;

		await this.postSetConfiguration();

		// TODO: validate balance

		const isSymbolExists = await this.isExistsSymbol(this.config.symbol);
		if (!isSymbolExists) {
			throw new BadRequestException(
				`Тикер ${this.config.symbol} не найден.`,
			);
		}

		this.updateState(BotState.Initializing);

		// validate configs
		// TODO: do something

		this.snapshots.start = await this.createSnapshot();

		await this.sendMessage(this.getSnapshotMessage(this.snapshots.start));

		await this.init();
	}

	public async stop(): Promise<void> {
		// TODO: do something
		this.updateState(BotState.Stopping);

		this.snapshots.end = await this.createSnapshot();

		this.state = BotState.Stopped;
		await this.sendMessage(
			`------ Открытие ------\n\n` +
				this.getSnapshotMessage(this.snapshots.start!) +
				'\n\n' +
				`------ Закрытие ------\n\n` +
				this.getSnapshotMessage(this.snapshots.end!),
		);

		await this.cleanUp();

		this.updateState(BotState.Stopped);
	}

	protected addNewOrder(order: TradingBotOrder) {
		this.orders.push(order);
	}

	protected calculatePnL(currentPrice: number) {
		const buyStack: TradingBotOrder[] = []; // Stack to track buy orders for stop-losses
		let realizedPnL = 0;
		if (!currentPrice && this.orders.length) {
			currentPrice = this.orders[this.orders.length - 1]!.avgPrice;
		}

		this.orders.forEach((order) => {
			if (order.side === 'buy') {
				buyStack.push(order);
			} else if (order.side === 'sell' && buyStack.length > 0) {
				const lastBuy = buyStack.pop();
				if (lastBuy) {
					const sellPnL =
						(order.avgPrice - lastBuy.avgPrice) * order.quantity;
					realizedPnL += sellPnL;
				}
			}
			realizedPnL -= order.fee;
		});
		const unrealizedPnL = buyStack.reduce((total, buyOrder) => {
			return (
				total + (currentPrice - buyOrder.avgPrice) * buyOrder.quantity
			);
		}, 0);

		return {
			realizedPnL,
			unrealizedPnL,
		};
	}

	private getSnapshotMessage(snapshot: TradingBotSnapshot): string {
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

	protected async makeFirstOrders() {
		if (
			this.state !== BotState.Idle &&
			this.state !== BotState.Initializing
		)
			return;

		console.log('makeFirstOrders');

		try {
			const startPrice = await this.getTickerPrice(this.config.symbol);
			this.updateTriggerPrices(startPrice);
			this.updateState(BotState.Running);

			await this.submitOrder({
				side: 'buy',
				customId: this.getCustomOrderId('Order-buy', startPrice),
				type: 'order',
				price: startPrice,
				quantity: this.config.gridVolume,
				symbol: this.config.symbol,
			});
		} catch (err) {
			console.log('ERROR while makeFirstOrders', err);
		}
	}

	private async submitManyOrders(
		orders: CreateTradingBotOrder[],
		attempts = this.requestConfig.maxAttempts,
	) {
		if (orders.length === 0) return;

		const rawOrders = orders.map(this.getCreateOrderParams);

		// this.loggerService.info('submitOrderWithRetry', ordersParams);

		while (attempts > 0) {
			try {
				await this.submitManyOrdersImpl(rawOrders);
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

	private async submitOrder(
		order: CreateTradingBotOrder,
		attempts = this.requestConfig.maxAttempts,
	) {
		const rawOrder = this.getCreateOrderParams(order);

		// this.loggerService.info('submitOrderWithRetry', ordersParams);

		while (attempts > 0) {
			try {
				await this.submitOrderImpl(rawOrder);
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

	protected abstract submitOrderImpl(orderParams: any): Promise<void>;
	protected abstract submitManyOrdersImpl(ordersParams: any[]): Promise<void>;
	protected abstract getTickerPrice(ticker: string): Promise<number>;
	protected abstract getCreateOrderParams(order: CreateTradingBotOrder): any;
	protected abstract parseIncomingOrder(order: any): TradingBotOrder;
	protected abstract isExistsSymbol(symbol: string): Promise<boolean>;
	protected abstract postSetConfiguration(): Promise<void>;
	protected abstract init(): Promise<void>;
	protected abstract cleanUp(): Promise<void>;
	protected abstract createSnapshot(): Promise<TradingBotSnapshot>;
}
