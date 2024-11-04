import { IUser } from '@/domain/interfaces/account/user.interface';
import {
	BotState,
	ExchangeCredentialsType,
	IExchangeCredentials,
	ITradingBot,
	ITradingBotConfig,
	TradingBotSnapshot,
	TraidingBotOrder,
} from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import TelegramService from '@/infrastructure/services/telegram/telegram.service';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { TradingbotUserError } from './errors';

@Injectable({ scope: Scope.TRANSIENT })
export abstract class BaseReverseGridBot implements ITradingBot {
	protected readonly orders: TraidingBotOrder[] = [];
	protected config: ITradingBotConfig;
	protected state: BotState = BotState.Idle;
	protected credentials: IExchangeCredentials;
	protected user: IUser;
	protected isTestnet: boolean;

	@Inject(TelegramService)
	private readonly telegramService: TelegramService;

	protected readonly snapshots: {
		start?: TradingBotSnapshot;
		end?: TradingBotSnapshot;
	} = {};

	protected async sendMessage(message: string) {
		this.telegramService.sendMessage(this.user.id, message);
	}

	protected getCustomOrderId(side: string, price: number): string {
		return `${side}_${price}_${Date.now()}`;
	}

	protected getPriceFromCustomOrderId(orderId: string): number | null {
		if (!orderId) return null;

		const [side, triggerPriceStr] = orderId.split('_');
		if (!triggerPriceStr) return null;

		return Number(triggerPriceStr) || null;
	}

	public async start(
		config: ITradingBotConfig,
		credentials: IExchangeCredentials,
		user: IUser,
	): Promise<void> {
		// TODO: validate config and callback
		if (this.state !== BotState.Idle) {
			return this.sendMessage(
				`Бот ну могут запускаться, bot state: ${this.state}`,
			);
		}

		this.config = config;
		this.credentials = credentials;
		this.user = user;
		this.isTestnet =
			this.credentials.type == ExchangeCredentialsType.Testnet;

		await this.postSetConfiguration();

		// TODO: validate balance

		const isSymbolExists = await this.isExistsSymbol(this.config.symbol);
		if (!isSymbolExists) {
			throw new TradingbotUserError(
				`Тикер ${this.config.symbol} не найден.`,
			);
		}

		this.state = BotState.Initializing;

		// validate configs
		// TODO: do something

		this.snapshots.start = await this.createSnapshot();

		await this.sendMessage(this.getSnapshotMessage(this.snapshots.start));

		await this.init();
	}

	public async stop(): Promise<void> {
		// TODO: do something
		this.state = BotState.Stopping;

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
	}

	protected addNewOrder(order: TraidingBotOrder) {
		this.orders.push(order);
	}

	protected calculatePnL(currentPrice: number) {
		const buyStack: TraidingBotOrder[] = []; // Stack to track buy orders for stop-losses
		let realizedPnL = 0;
		if (!currentPrice && this.orders.length) {
			currentPrice = this.orders[this.orders.length - 1]!.price;
		}

		this.orders.forEach((order) => {
			if (order.type === 'buy') {
				buyStack.push(order);
			} else if (order.type === 'sell' && buyStack.length > 0) {
				const lastBuy = buyStack.pop();
				if (lastBuy) {
					const sellPnL =
						(order.price - lastBuy.price) * order.quantity;
					realizedPnL += sellPnL;
				}
			}
			realizedPnL -= order.fee;
		});
		const unrealizedPnL = buyStack.reduce((total, buyOrder) => {
			return total + (currentPrice - buyOrder.price) * buyOrder.quantity;
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
				timeZone: 'Asia/Almaty', // Almaty time zone
			})}`
		);
	}

	protected abstract isExistsSymbol(symbol: string): Promise<boolean>;
	protected abstract postSetConfiguration(): Promise<void>;
	protected abstract init(): Promise<void>;
	protected abstract cleanUp(): Promise<void>;
	protected abstract createSnapshot(): Promise<TradingBotSnapshot>;
}
