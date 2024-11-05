import {
	CreateTradingBotOrder,
	TradingBotOrder,
	TradingBotSnapshot,
} from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import { WalletBalance } from '@/domain/interfaces/trading-bots/wallet.interface';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { Injectable, Scope } from '@nestjs/common';
import {
	BatchOrderParamsV5,
	OrderParamsV5,
	RestClientV5,
	WalletBalanceV5,
	WebsocketClient,
} from 'bybit-api';
import { BaseReverseGridBot } from '../common/base-reverse-grid-bot';

/**
 * TODO
 * 1. check for grids count. max grid count must be 25. if reaches to 25, then sell first orders to make grid count to 25.
 * 2. trade only usdt: check in validation
 */

@Injectable({ scope: Scope.TRANSIENT })
export class BybitSpotReverseGridBot extends BaseReverseGridBot {
	private restClient: RestClientV5;
	private wsClient: WebsocketClient;

	private publicWsClient: WebsocketClient;

	private readonly accountType: WalletBalanceV5['accountType'] = 'UNIFIED';

	constructor(private readonly loggerService: LoggerService) {
		super();
	}

	protected async isExistsSymbol(symbol: string): Promise<boolean> {
		const coinPriceRes = await this.restClient.getTickers({
			category: 'spot' as any,
			symbol,
		});

		return !!coinPriceRes.result?.list?.length;
	}

	protected async postSetConfiguration(): Promise<void> {
		this.restClient = new RestClientV5({
			key: this.credentials.apiKey,
			secret: this.credentials.apiSecret,
			demoTrading: this.isTestnet,
			parseAPIRateLimits: true,
			recv_window: 10_000,
		});

		this.wsClient = new WebsocketClient({
			key: this.credentials.apiKey,
			secret: this.credentials.apiSecret,
			market: 'v5',
			demoTrading: this.isTestnet,
		});

		this.publicWsClient = new WebsocketClient({
			market: 'v5',
		});
	}

	protected async init() {
		this.configureWsEmits();

		await this.wsClient.subscribeV5('order', 'spot');
		await this.publicWsClient.subscribeV5(
			`tickers.${this.config.symbol}`,
			'spot',
		);
	}

	protected async cleanUp() {
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
			if (order.side === 'buy') allQuantity += order.quantity;
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

		this.wsClient.closeAll(true);
		this.publicWsClient.closeAll(true);

		this.wsClient.removeAllListeners();
		this.publicWsClient.removeAllListeners();

		// @ts-ignore
		this.wsClient = null;
		// @ts-ignore
		this.publicWsClient = null;
	}

	protected async createSnapshot(): Promise<TradingBotSnapshot> {
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

	private configureWsEmits() {
		this.wsClient.on('update', async (data) => {
			if (!data) return;

			if (data.topic === 'order' && data.data) {
				for (let order of data.data) {
					if (order.orderStatus === 'Filled') {
						await this.handleNewFilledOrder(order);
					}
				}
			}
		});
		this.publicWsClient.on('update', (data) => {
			if (!data) return;
			if (data.topic === `tickers.${this.config.symbol}`) {
				if (data.data) {
					const lastPrice = Number(data.data.lastPrice);
					this.updateLastPrice(lastPrice);
				}
			}
		});
		this.wsClient.on('open', () => {
			this.loggerService.info('WS OPENED');
		});

		this.wsClient.on('response', (data) => {
			if (!data) return;

			if (data.success && data.req_id === 'order') {
				this.makeFirstOrders();
			}
		});

		this.wsClient.on('reconnect', (data) => {
			this.loggerService.info('ws reconnecting.... ');
		});

		this.wsClient.on('reconnected', (data) => {
			this.loggerService.info('ws reconnected ');
		});
	}

	protected getCreateOrderParams(
		order: CreateTradingBotOrder,
	): OrderParamsV5 {
		const params: OrderParamsV5 = {
			category: 'spot',
			side: order.side === 'buy' ? 'Buy' : 'Sell',
			qty: order.quantity.toFixed(6).toString(),
			orderLinkId: order.customId,
			symbol: order.symbol,
			orderType: 'Market',
			marketUnit: 'baseCoin',
			timeInForce: 'GTC',
			isLeverage: order.side === 'buy' ? 1 : 0,
		};

		if (order.type === 'order') {
			params.orderFilter = 'Order';
		} else if (order.type === 'stop-loss') {
			params.orderFilter = 'tpslOrder';
			params.slOrderType = 'Market';
			params.triggerPrice = order.price.toString();
		} else if (order.type === 'stop-order') {
			params.orderFilter = 'StopOrder';
			params.triggerPrice = order.price.toString();
		}

		console.log(order, params);

		return params;
	}

	protected parseIncomingOrder(order: any): TradingBotOrder {
		return {
			id: order.id,
			avgPrice: Number(order.avgPrice),
			customId: order.orderLinkId,
			fee: Number(order.cumExecFee),
			feeCurrency: order.feeCurrency,
			quantity: Number(order.qty),
			side: order.side === 'Buy' ? 'buy' : 'sell',
			symbol: this.config.symbol,
		};
	}

	protected async submitOrderImpl(orderParams: OrderParamsV5): Promise<void> {
		const response = await this.restClient.submitOrder(orderParams);
		if (response.retCode === 0) {
			this.loggerService.info('Order placed successfully:', response);
			return;
		} else {
			throw new Error(response.retMsg);
		}
	}

	protected async submitManyOrdersImpl(
		ordersParams: BatchOrderParamsV5[],
	): Promise<void> {
		const response = await this.restClient.batchSubmitOrders(
			'spot' as any,
			ordersParams,
		);
		if (response.retCode === 0) {
			this.loggerService.info('Orders placed successfully');
		} else {
			throw new Error(response.retMsg);
		}
	}

	protected async getTickerPrice(ticker: string): Promise<number> {
		const res = await this.restClient.getTickers({
			category: 'spot',
			symbol: this.config.symbol,
		});
		return Number(res.result.list[0]?.lastPrice);
	}
}
