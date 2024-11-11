import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import { TradingBotOrder } from '@/domain/interfaces/trading-bots/trading-bot.interface';

type CalclatePnlOrderType = Pick<
	TradingBotOrder,
	'avgPrice' | 'side' | 'quantity' | 'fee'
>;

export function calculateOrdersPnL(
	orders: CalclatePnlOrderType[],
	currentPrice: number = 0,
) {
	const buyStack: CalclatePnlOrderType[] = []; // Track long positions
	const sellStack: CalclatePnlOrderType[] = []; // Track short positions
	let totalProfit = 0;
	let fee = 0;

	if (!currentPrice && orders.length) {
		currentPrice = orders[orders.length - 1]!.avgPrice;
	}

	const processClosingOrders = (
		stack: CalclatePnlOrderType[],
		orderPrice: number,
		orderQuantity: number,
		isLong: boolean,
	) => {
		let positionSum = 0;
		let quantitySum = 0;

		while (quantitySum < orderQuantity && stack.length > 0) {
			const lastOrder = stack.pop()!;
			const closingQuantity = Math.min(
				lastOrder.quantity,
				orderQuantity - quantitySum,
			);

			positionSum += lastOrder.avgPrice * closingQuantity;
			quantitySum += closingQuantity;

			if (lastOrder.quantity > closingQuantity) {
				lastOrder.quantity -= closingQuantity;
				stack.push(lastOrder); // Push back with updated quantity if partially closed
			}
		}

		if (quantitySum > 0) {
			const avgPositionPrice = positionSum / quantitySum;
			const pnl =
				(isLong
					? orderPrice - avgPositionPrice
					: avgPositionPrice - orderPrice) * quantitySum;
			totalProfit += pnl;
		}
	};

	orders.forEach((order) => {
		if (order.side === OrderSide.BUY) {
			// If there are open short positions, attempt to close them with a buy order
			if (sellStack.length > 0) {
				processClosingOrders(
					sellStack,
					order.avgPrice,
					order.quantity,
					false,
				);
			} else {
				buyStack.push(order); // Open new long position
			}
		} else if (order.side === OrderSide.SELL) {
			// If there are open long positions, attempt to close them with a sell order
			if (buyStack.length > 0) {
				processClosingOrders(
					buyStack,
					order.avgPrice,
					order.quantity,
					true,
				);
			} else {
				sellStack.push(order); // Open new short position
			}
		}

		fee -= order.fee;
	});

	const unrealizedPnL =
		buyStack.reduce(
			(total, buyOrder) =>
				total + (currentPrice - buyOrder.avgPrice) * buyOrder.quantity,
			0,
		) +
		sellStack.reduce(
			(total, sellOrder) =>
				total +
				(sellOrder.avgPrice - currentPrice) * sellOrder.quantity,
			0,
		);

	const realizedPnL = totalProfit + fee;

	return {
		totalProfit,
		fee,
		realizedPnL,
		unrealizedPnL,
		PnL: realizedPnL + unrealizedPnL,
	};
}
