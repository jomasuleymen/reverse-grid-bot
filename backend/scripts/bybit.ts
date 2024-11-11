import { WebsocketClient } from 'bybit-api';

const ws = new WebsocketClient({
	key: 'heQ2U5zd2j78w5OTvY',
	secret: 'ZGpIVNiJgQxFkHQWt7VkovXXiseE4JmcK65s',
	market: 'v5',
	demoTrading: false,
});

ws.subscribeV5(`tickers.BTCUSDT`, 'spot')
	.then((res) => {
		console.log('RES', res);
	})
	.catch((err) => {
		console.log('ERR', err);
	});

ws.on('update', (data) => {
	console.log('update', data);
});
