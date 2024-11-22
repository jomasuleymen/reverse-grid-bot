import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import {
	CreateTradingBotOrder,
	ExchangeCredentialsType,
	TradingBotOrder,
} from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { WalletBalance } from '@/domain/interfaces/trading-bots/wallet.interface';
import { BinanceService } from '@/infrastructure/exchanges/modules/binance/binance.service';
import {
	FallbackResult,
	retryWithFallback,
} from '@/infrastructure/utils/request.utils';
import { BadRequestException, Injectable, Scope } from '@nestjs/common';
import {
	MainClient,
	NewSpotOrderParams,
	WebsocketClient,
	WsFormattedMessage,
	WsMessageSpotUserDataExecutionReportEventFormatted,
} from 'binance';
import { SECOND } from 'time-constants';
import { BaseReverseGridBot } from '../common/base-reverse-grid-bot';

@Injectable({ scope: Scope.TRANSIENT })
export class BinanceSpotReverseGridBot extends BaseReverseGridBot {
	private restClient: MainClient;
	private wsClient: WebsocketClient;

	constructor(private readonly binanceService: BinanceService) {
		super();
	}

	protected async postSetConfiguration(): Promise<void> {
		if (this.credentials.type == ExchangeCredentialsType.Testnet) {
			throw new BadRequestException(
				'Бинанс спот не поддерживает тестовый торговля',
			);
		}

		this.restClient = new MainClient({
			api_key: this.credentials.apiKey,
			api_secret: this.credentials.apiSecret,
			recvWindow: 15 * SECOND,
		});

		this.wsClient = new WebsocketClient({
			api_key: this.credentials.apiKey,
			api_secret: this.credentials.apiSecret,
			beautify: true,
		});
	}

	protected async init() {
		this.configureWsEmits();

		this.wsClient.subscribeSpotSymbol24hrTicker(this.symbol);
		this.wsClient.subscribeMarginUserDataStream();
	}

	private configureWsEmits() {
		this.wsClient.on(
			'formattedMessage',
			async (data: WsFormattedMessage) => {
				if (!Array.isArray(data)) {
					if (data.eventType === '24hrTicker') {
						if (data.symbol === this.symbol) {
							const lastPrice = Number(data.currentClose);
							this.marketData.currentPrice = lastPrice;
						}
						return;
					} else if (data.eventType === 'executionReport') {
						if (data.symbol === this.symbol) {
							if (data.orderStatus === 'FILLED') {
								const parsedOrder =
									this.parseIncomingOrder(data);
								await this.handleNewFilledOrder(parsedOrder);
							}
						}
					}
				}
			},
		);

		this.wsClient.on('open', async (data: any) => {
			if (data.wsKey.includes('userData')) {
				this.makeFirstOrder();
			}
		});

		this.wsClient.on('reply', (data: any) => {
			this.logger.info('log reply: ', data);
		});

		this.wsClient.on('reconnecting', (data: any) => {
			this.logger.info('ws automatically reconnecting.... ', data?.wsKey);
		});

		this.wsClient.on('reconnected', (data: any) => {
			this.logger.info('ws has reconnected ', data?.wsKey);
		});
	}

	protected async cancelAllOrders(): Promise<void> {
		await this.restClient.marginAccountCancelOpenOrders({
			symbol: this.symbol,
			isIsolated: 'FALSE',
		});
	}

	protected async cleanUpImpl() {
		try {
			if (this.wsClient) {
				this.wsClient.closeAll(true);
				this.wsClient.removeAllListeners();
			}

			// @ts-ignore
			this.wsClient = null;
		} catch (err) {
			this.logger.error('Error while cleaning up', err);
		}
	}

	protected async getWalletBalance(): Promise<WalletBalance> {
		const walletBalanceRes = await retryWithFallback(
			() => this.restClient.queryCrossMarginAccountDetails(),
			{
				attempts: 3,
				delay: 500,
			},
		);

		if (!walletBalanceRes.ok) {
			this.logger.error('Failed to fetch wallet balance after retries', {
				response: walletBalanceRes,
			});
			return this.exchangesService.emptyWalletBalance();
		}

		return this.binanceService.formatWalletBalance(walletBalanceRes.data);
	}

	protected getCreateOrderParams(order: CreateTradingBotOrder) {
		const params: NewSpotOrderParams = {
			type: 'MARKET',
			isIsolated: 'FALSE',
			quantity: order.quantity,
			side: order.side === OrderSide.BUY ? 'BUY' : 'SELL',
			symbol: order.symbol,
			newClientOrderId: order.customId,
			newOrderRespType: 'RESULT',
			sideEffectType: 'AUTO_BORROW_REPAY' as any,
		};

		if (order.type === 'order') {
			params.type = 'MARKET';
		} else if (order.type === 'stop-loss') {
			params.type =
				order.side === OrderSide.BUY ? 'TAKE_PROFIT' : 'STOP_LOSS';
			params.stopPrice = order.triggerPrice;
		} else if (order.type === 'stop-order') {
			params.type = 'STOP_LOSS';
			params.stopPrice = order.triggerPrice;
		}

		return params;
	}

	protected parseIncomingOrder(
		order: WsMessageSpotUserDataExecutionReportEventFormatted,
	): TradingBotOrder {
		return {
			id: order.orderId.toString(),
			avgPrice: Number(order.lastTradePrice),
			customId: order.newClientOrderId,
			fee: Number(order.commission),
			feeCurrency: order.commissionAsset as string,
			quantity: Number(order.quantity),
			side: order.side === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
			symbol: order.symbol,
			createdDate: new Date(order.orderCreationTime),
		};
	}

	private async submitOrder(params: NewSpotOrderParams) {
		return retryWithFallback(
			() => this.restClient.marginAccountNewOrder(params),
			{ attempts: 3, delay: 500 },
		);
	}

	protected async submitOrdersImpl(
		orders: CreateTradingBotOrder[],
	): Promise<FallbackResult> {
		const ordersParams = orders.map((order) =>
			this.getCreateOrderParams(order),
		);

		const res = await Promise.all(
			ordersParams.map((orderParams) => this.submitOrder(orderParams)),
		);

		return {
			ok: res.every((order) => order.ok),
			data: res,
			message: res.length ? (res[0] as any).message : 'message',
		};
	}

	protected async getTickerPrice(ticker: string): Promise<number> {
		return this.binanceService.getTickerLastPrice(ticker);
	}

	protected getSymbol(baseCurrency: string, quoteCurrency: string): string {
		return baseCurrency + quoteCurrency;
	}

	protected async getLastFilledOrders(count: number): Promise<TradingBotOrder[]> {
		return [];
	}
}
