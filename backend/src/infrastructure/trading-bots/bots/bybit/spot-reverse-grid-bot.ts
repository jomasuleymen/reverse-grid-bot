import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import {
	CreateTradingBotOrder,
	ExchangeCredentialsType,
	TradingBotOrder,
} from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { WalletBalance } from '@/domain/interfaces/trading-bots/wallet.interface';
import { BybitService } from '@/infrastructure/exchanges/modules/bybit/bybit.service';
import { retryWithFallback } from '@/infrastructure/utils/request.utils';
import { Injectable, Scope } from '@nestjs/common';
import {
	OrderParamsV5,
	RestClientV5,
	WalletBalanceV5,
	WebsocketClient,
} from 'bybit-api';
import { Agent } from 'http';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { SECOND } from 'time-constants';
import { BaseReverseGridBot } from '../common/base-reverse-grid-bot';

@Injectable({ scope: Scope.TRANSIENT })
export class BybitSpotReverseGridBot extends BaseReverseGridBot {
	private restClient: RestClientV5;
	private wsClient: WebsocketClient;

	private readonly accountType: WalletBalanceV5['accountType'] = 'UNIFIED';

	private readonly handlers: Record<string, (...args: any[]) => void> = {};

	constructor(private readonly bybitService: BybitService) {
		super();
	}

	protected async postSetConfiguration(): Promise<void> {
		const isTestnet =
			this.credentials.type == ExchangeCredentialsType.Testnet;

		let httpsAgent: Agent | undefined;
		let socksAgent: Agent | undefined;

		if (this.proxy) {
			httpsAgent = new HttpsProxyAgent(
				`http://${this.proxy.login}:${this.proxy.password}@${this.proxy.ip}:${this.proxy.port.http}`,
			);

			socksAgent = new SocksProxyAgent(
				`socks5://${this.proxy.login}:${this.proxy.password}@${this.proxy.ip}:${this.proxy.port.socket}`,
			);
		}

		this.restClient = new RestClientV5(
			{
				key: this.credentials.apiKey,
				secret: this.credentials.apiSecret,
				demoTrading: isTestnet,
				recv_window: 10 * SECOND,
			},
			{
				httpsAgent: httpsAgent,
			},
		);

		this.wsClient = new WebsocketClient({
			key: this.credentials.apiKey,
			secret: this.credentials.apiSecret,
			market: 'v5',
			demoTrading: isTestnet,
			requestOptions: {
				agent: socksAgent,
			},
		});
	}

	protected async init() {
		this.configureWsEmits();
	}

	private configureWsEmits() {
		this.wsClient.subscribeV5('order', 'spot');
		const handler = (data: any) => {
			if (data.topic === `tickers.${this.symbol}` && data.data) {
				this.marketData.currentPrice = Number(data.data.lastPrice);
			}
		};

		this.handlers[`tickers.${this.symbol}`] = handler;
		this.bybitService.subscribe(`tickers.${this.symbol}`, handler);

		this.wsClient.on('update', async (data) => {
			if (!data) return;

			if (data.topic === 'order' && data.data) {
				for (let order of data.data) {
					if (
						order.orderStatus === 'Filled' &&
						this.symbol === order.symbol
					) {
						const parsedOrder = this.parseIncomingOrder(order);
						await this.handleNewFilledOrder(parsedOrder);
					}
				}
			}
		});

		this.wsClient.on('response', (data) => {
			if (!data) return;

			if (data.success && data.req_id === 'order') {
				this.successInit();
			}
		});

		this.wsClient.on('open', () => {
			this.logger.info('Bybit private ws OPENED');
		});

		this.wsClient.on('reconnect', (data) => {
			this.logger.info('Bybit private ws reconnecting.... ');
		});

		this.wsClient.on('reconnected', (data) => {
			this.logger.info('Bybit private ws reconnected ');
		});
	}

	protected async cancelAllOrders(): Promise<void> {
		await Promise.all([
			this.restClient.cancelAllOrders({
				category: 'spot',
				orderFilter: 'StopOrder',
				symbol: this.symbol,
			}),
			this.restClient.cancelAllOrders({
				category: 'spot',
				orderFilter: 'tpslOrder',
				symbol: this.symbol,
			}),
		]).then((res) => {
			this.logger.info('stop.cancelAllOrders', res);
		});
	}

	protected async cleanUpImpl() {
		if (this.wsClient) {
			this.wsClient.closeAll(true);
			this.wsClient.removeAllListeners();
			// @ts-ignore
			this.wsClient = null;
		}

		const handler = this.handlers[`tickers.${this.symbol}`];

		if (handler) {
			this.bybitService.unsubscribe(`tickers.${this.symbol}`, handler);
		}
	}

	protected async getWalletBalance(): Promise<WalletBalance> {
		const walletBalanceRes = await retryWithFallback(
			() =>
				this.restClient.getWalletBalance({
					accountType: this.accountType,
				}),
			{
				attempts: 4,
				delay: 500,
				checkIfSuccess(res) {
					return {
						success: res.retCode === 0,
						message: res.retMsg,
					};
				},
			},
		);

		if (!walletBalanceRes.ok) {
			this.logger.error('Failed to fetch wallet balance after retries', {
				response: walletBalanceRes,
			});
			return this.exchangesService.emptyWalletBalance();
		}

		const accountBalance = walletBalanceRes.data.result?.list?.find(
			(wallet) => wallet.accountType === this.accountType,
		);

		if (!accountBalance) {
			const errorMsg = `Account type "${this.accountType}" not found in wallet balance response.`;
			this.logger.error(errorMsg, { response: walletBalanceRes });
			return this.exchangesService.emptyWalletBalance();
		}

		return this.bybitService.formatWalletBalance(accountBalance);
	}

	private getCreateOrderParams(order: CreateTradingBotOrder): OrderParamsV5 {
		const params: OrderParamsV5 = {
			category: 'spot',
			side: order.side === OrderSide.BUY ? 'Buy' : 'Sell',
			qty: order.quantity.toString(),
			orderLinkId: order.customId,
			symbol: order.symbol,
			orderType: 'Market',
			marketUnit: 'baseCoin',
			timeInForce: 'GTC',
			isLeverage: 1,
		};

		if (order.type === 'order') {
			params.orderFilter = 'Order';
		} else if (order.type === 'stop-loss') {
			params.orderFilter = 'tpslOrder';
			params.slOrderType = 'Market';
			params.triggerPrice = order.triggerPrice.toString();
		} else if (order.type === 'stop-order') {
			params.orderFilter = 'StopOrder';
			params.triggerPrice = order.triggerPrice.toString();
		}

		return params;
	}

	private parseIncomingOrder(order: any): TradingBotOrder {
		return {
			id: order.orderId,
			avgPrice: Number(order.avgPrice),
			customId: order.orderLinkId,
			fee: Number(order.cumExecFee),
			feeCurrency: order.feeCurrency,
			quantity: Number(order.qty),
			side: order.side === 'Buy' ? OrderSide.BUY : OrderSide.SELL,
			symbol: order.symbol || this.symbol,
			createdDate: new Date(Number(order.updatedTime) || 0),
		};
	}

	protected async submitOrdersImpl(
		orders: CreateTradingBotOrder[],
	): Promise<any> {
		const ordersParams = orders.map((order) =>
			this.getCreateOrderParams(order),
		);

		const impl: any =
			ordersParams.length === 1
				? () => this.restClient.submitOrder(ordersParams[0]!)
				: () =>
						this.restClient.batchSubmitOrders(
							'spot' as any,
							ordersParams,
						);

		return await retryWithFallback(impl, {
			attempts: 3,
			delay: 500,
			checkIfSuccess(res: any) {
				return {
					success: res.retCode === 0,
					message: res.retMsg,
				};
			},
		});
	}

	protected async getTickerPrice(ticker: string): Promise<number> {
		return this.bybitService.getTickerLastPrice('spot', ticker);
	}

	protected getSymbol(baseCurrency: string, quoteCurrency: string): string {
		return baseCurrency + quoteCurrency;
	}
}
