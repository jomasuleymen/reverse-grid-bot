import { TraidingBotOrder } from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import { KLineRepo } from '@/infrastructure/repositories/trading/kline.repo';
import { Injectable } from '@nestjs/common';
import { RestClientV5 } from 'bybit-api';

type KlineInterval =
	| '1'
	| '3'
	| '5'
	| '15'
	| '30'
	| '60'
	| '120'
	| '240'
	| '360'
	| '720'
	| 'D'
	| 'M'
	| 'W';

@Injectable()
export class TradingUtils {
	private readonly restClient: RestClientV5;

	constructor(private readonly klineRepo: KLineRepo) {
		this.restClient = new RestClientV5({ parseAPIRateLimits: true });
		// this.restClient
		// 	.getKline({
		// 		category: 'spot',
		// 		symbol: 'BTCUSDT',
		// 		interval: '1',
		// 	})
		// 	.then((res) => {
		// 		console.log(res);
		// 		console.log(res.result.list);
		// 	});
		// this.calculatePnL({
		// 	category: 'spot',
		// 	symbol: 'BTCUSDT',
		// 	interval: '1',
		// 	start: 1670608800000,
		// 	end: 1670605200000,
		// }).then((res) => {
		// 	console.log('RESULT', res);
		// });
	}

	public async calculatePnL(payload: {
		category: 'spot';
		symbol: string;
		interval: KlineInterval;
		start: number | string;
		end: number | string;
	}) {
		const buyStack: TraidingBotOrder[] = [];
		// let realizedPnL = 0;

		// orders.forEach((order) => {
		// 	if (order.type === 'buy') {
		// 		// Push the buy order onto the stack
		// 		buyStack.push(order);
		// 	} else if (order.type === 'sell' && buyStack.length > 0) {
		// 		// Pop the latest buy order from the stack for each sell
		// 		const lastBuy = buyStack.pop();
		// 		if (lastBuy) {
		// 			console.log(
		// 				'TRIGGER',
		// 				lastBuy.price,
		// 				order.price,
		// 				order.price - lastBuy.price,
		// 				lastBuy.quantity,
		// 				order.quantity,
		// 			);
		// 			// Calculate realized P&L for this sell using the latest buy price
		// 			const sellPnL =
		// 				(order.price - lastBuy.price) * order.quantity;
		// 			realizedPnL += sellPnL;
		// 		}
		// 	}

		// 	realizedPnL -= order.fee;
		// });

		// // Calculate unrealized P&L for remaining holdings based on the current market price
		// const unrealizedPnL = buyStack.reduce((total, buyOrder) => {
		// 	return total + (currentPrice - buyOrder.price) * buyOrder.quantity;
		// }, 0);

		// return {
		// 	realizedPnL,
		// 	unrealizedPnL,
		// };
	}

	private fetchOrders() {}
}
