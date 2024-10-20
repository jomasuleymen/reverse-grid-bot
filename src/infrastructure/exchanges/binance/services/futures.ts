import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	USDMClient,
	WebsocketClient,
	WsMessageBookTickerEventFormatted,
	WsMessageFuturesUserDataTradeUpdateEventFormatted,
} from 'binance';

@Injectable()
export class BinanceFuturesService {
	private readonly apiKey: string;
	private readonly secretKey: string;
	private readonly isTestnet: boolean;
	private readonly restUsdmClient: USDMClient;
	private readonly wsClient: WebsocketClient;
	private latestOrdersData = {
		entryPrice: 0,
		isSending: false,
	};

	constructor(private readonly configService: ConfigService) {
		this.apiKey = this.configService.getOrThrow('binance.api.key');
		this.secretKey = this.configService.getOrThrow('binance.api.secret');

		if (!this.apiKey || !this.secretKey) {
			throw new Error('Binance credentials not provided');
		}

		this.isTestnet =
			this.configService.getOrThrow('environment') !== 'production';

		this.restUsdmClient = new USDMClient(
			{
				api_key: this.apiKey,
				api_secret: this.secretKey,
				recvWindow: 10_000,
			},
			{},
			this.isTestnet,
		);

		const testWslUrl = 'wss://stream.binancefuture.com';
		this.wsClient = new WebsocketClient({
			api_key: this.apiKey,
			api_secret: this.secretKey,
			beautify: true,
			wsUrl: this.isTestnet ? testWslUrl : undefined,
		});

		this.configureWsEmits(this.wsClient);

		this.wsClient.subscribeSymbolBookTicker('BTCUSDT', 'usdm');
		this.wsClient.subscribeUsdFuturesUserDataStream(true);

		// restUsdmClient
		// 	.setMarginType({ marginType: "ISOLATED", symbol: "BTCUSDT" })
		// 	.then((res) => console.log(res))
		// 	.catch((err) => console.error(err));

		// restUsdmClient.getSymbolPriceTicker({ symbol: "BTCUSDT" }).then((res) => {
		// 	console.log(res);
		// });
		// restUsdmClient
		// 	.getBalanceV3()
		// 	.then((res) => {
		// 		console.log(res);
		// 	})
		// 	.catch((err) => {
		// 		console.error(err);
		// 	});
		// createOrder();
	}

	async createNewOrder() {
		// this.restUsdmClient
		// 	.submitNewOrder({
		// 		side: 'BUY',
		// 		symbol: 'BTCUSDT',
		// 		positionSide: 'LONG',
		// 		type: 'MARKET',
		// 		quantity: 0.002,
		// 		workingType: 'CONTRACT_PRICE',
		// 	})
		// 	.then((res) => {
		// 		console.log(res);
		// 	})
		// 	.catch((err) => {
		// 		console.error(err);
		// 	});
	}

	private onBookTicker(data: WsMessageBookTickerEventFormatted) {
		if (
			(!this.latestOrdersData.entryPrice &&
				!this.latestOrdersData.isSending) ||
			data.askPrice <= this.latestOrdersData.entryPrice - 100
		) {
			this.latestOrdersData.isSending = true;
			console.log('bookTicker: ', data);
			this.createNewOrder();
		} else if (data.askPrice >= this.latestOrdersData.entryPrice + 100) {
			// createOrder();
			console.log(data.askPrice, this.latestOrdersData.entryPrice);
		}
	}

	private onOrderTradeUpdate(
		data: WsMessageFuturesUserDataTradeUpdateEventFormatted,
	) {
		console.log('update trade: ', data);

		if (data.order.averagePrice) {
			this.latestOrdersData.entryPrice = data.order.averagePrice;
			// this.restUsdmClient
			// 	.submitNewOrder({
			// 		side: 'SELL',
			// 		positionSide: 'LONG',
			// 		symbol: 'BTCUSDT',
			// 		timeInForce: 'GTE_GTC',
			// 		quantity: 0.002,
			// 		stopPrice: data.order.averagePrice - 100,
			// 		workingType: 'CONTRACT_PRICE',
			// 		type: 'STOP_MARKET',
			// 		priceProtect: 'TRUE',
			// 	})
			// 	.then((res) => {
			// 		console.log(res);
			// 		this.latestOrdersData.isSending = false;
			// 	})
			// 	.catch((err) => {
			// 		console.error(err);
			// 	});
		}
	}

	private configureWsEmits(ws: WebsocketClient) {
		ws.on('formattedMessage', (data) => {
			if (!Array.isArray(data)) {
				if (data.eventType === 'bookTicker')
					return this.onBookTicker(data);
				if (data.eventType === 'ORDER_TRADE_UPDATE')
					return this.onOrderTradeUpdate(data);
			}

			console.log(data);
		});

		ws.on('open', (data) => {
			console.log(
				'connection opened open:',
				data.wsKey,
				data.ws.target.url,
			);
		});

		ws.on('reconnecting', (data) => {
			console.log('ws automatically reconnecting.... ', data?.wsKey);
		});

		ws.on('reconnected', (data) => {
			console.log('ws has reconnected ', data?.wsKey);
		});
	}
}
