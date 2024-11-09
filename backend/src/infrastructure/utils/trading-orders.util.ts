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
	let totalProfit = 0;
	let fee = 0;

	if (!currentPrice && orders.length) {
		currentPrice = orders[orders.length - 1]!.avgPrice;
	}

	orders.forEach((order) => {
		if (order.side === OrderSide.BUY) {
			buyStack.push(order);
		} else if (order.side === OrderSide.SELL && buyStack.length > 0) {
			let buySum = 0;
			let buyQuantitySum = 0;

			while (buyQuantitySum < order.quantity && buyStack.length > 0) {
				const lastBuy = buyStack.pop()!;
				const buyQuantity = Math.min(
					lastBuy.quantity,
					order.quantity - buyQuantitySum,
				);

				buySum += lastBuy.avgPrice * buyQuantity;
				buyQuantitySum += buyQuantity;

				// Reduce quantity of the last buy if partially used
				if (lastBuy.quantity > buyQuantity) {
					lastBuy.quantity -= buyQuantity;
					buyStack.push(lastBuy); // Put back with updated quantity
				}
			}

			if (buyQuantitySum > 0) {
				const avgBuyPrice = buySum / buyQuantitySum;
				const sellPnL = (order.avgPrice - avgBuyPrice) * buyQuantitySum;
				totalProfit += sellPnL;
			}
		}

		fee -= order.fee;
	});

	const realizedPnL = totalProfit + fee;
	const unrealizedPnL = buyStack.reduce((total, buyOrder) => {
		return total + (currentPrice - buyOrder.avgPrice) * buyOrder.quantity;
	}, 0);

	return {
		totalProfit,
		fee,
		realizedPnL,
		unrealizedPnL,
		PnL: realizedPnL + unrealizedPnL,
	};
}
