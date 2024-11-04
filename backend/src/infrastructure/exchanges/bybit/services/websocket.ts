import { Injectable } from '@nestjs/common';
import { WebsocketClient } from 'bybit-api';

@Injectable()
export class BybitSpotWebsocket {
	private readonly publicWsClient: WebsocketClient;
	
	constructor() {
		this.publicWsClient = new WebsocketClient({
			market: 'v5',
		});

		// this.publicWsClient
		// 	.subscribeV5('tickers.BTCUSDT', 'spot')
		// 	.then((res) => {
		// 		console.log('res', res);
		// 	})
		// 	.catch((err) => {
		// 		console.log('err', err);
		// 	});
	}
}
