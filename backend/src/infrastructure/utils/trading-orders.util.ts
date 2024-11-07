import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import { TradingBotOrder } from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';

type CalclatePnlOrderType = Pick<
	TradingBotOrder,
	'avgPrice' | 'side' | 'quantity' | 'fee'
>;

export function calculateOrdersPnL(
	orders: CalclatePnlOrderType[],
	currentPrice: number = 0,
) {
	const buyStack: CalclatePnlOrderType[] = []; // Stack to track buy orders for stop-losses
	let realizedPnL = 0;

	if (!currentPrice && orders.length) {
		currentPrice = orders[orders.length - 1]!.avgPrice;
	}

	orders.forEach((order) => {
		if (order.side === OrderSide.BUY) {
			buyStack.push(order);
		} else if (order.side === OrderSide.SELL && buyStack.length > 0) {
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
		return total + (currentPrice - buyOrder.avgPrice) * buyOrder.quantity;
	}, 0);

	return {
		realizedPnL,
		unrealizedPnL,
		PnL: realizedPnL + unrealizedPnL,
	};
}
