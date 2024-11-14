import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import { TradingBotOrder } from '@/domain/interfaces/trading-bots/trading-bot.interface';

type CalclatePnlOrderType = Pick<
	TradingBotOrder,
	'avgPrice' | 'side' | 'quantity' | 'fee'
>;

type Options = {
	currentPrice?: number;
	analyzeInDetails?: boolean;
};

export function calculateOrdersPnL(
	orders: CalclatePnlOrderType[],
	options: Options = {},
) {
	let { analyzeInDetails = false, currentPrice = 0 } = options;

	const buyStack: CalclatePnlOrderType[] = []; // Track long positions
	const sellStack: CalclatePnlOrderType[] = []; // Track short positions
	let sellCount = 0;
	let buyCount = 0;
	let totalProfit = 0;
	let fee = 0;

	const statistics = {
		maxUnrealizedPnl: Number.MIN_SAFE_INTEGER,
		maxPnl: Number.MIN_SAFE_INTEGER,
		minPnl: Number.MAX_SAFE_INTEGER,
	};

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

	const calculateUnrealizedPnl = (price?: number) => {
		price = price || currentPrice;

		return (
			buyStack.reduce(
				(total, buyOrder) =>
					total + (price - buyOrder.avgPrice) * buyOrder.quantity,
				0,
			) +
			sellStack.reduce(
				(total, sellOrder) =>
					total + (sellOrder.avgPrice - price) * sellOrder.quantity,
				0,
			)
		);
	};

	orders.forEach((order) => {
		if (order.side === OrderSide.BUY) {
			buyCount++;
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
			sellCount++;
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

		const unrealizedPnL = calculateUnrealizedPnl(order.avgPrice);
		const realizedPnL = totalProfit + fee;
		const pnl = unrealizedPnL + realizedPnL;

		statistics.maxUnrealizedPnl = Math.max(
			pnl,
			statistics.maxUnrealizedPnl,
		);
		statistics.minPnl = Math.min(pnl, statistics.minPnl);
		statistics.maxPnl = Math.max(pnl, statistics.maxPnl);

		if (analyzeInDetails) {
			const data = {
				pnl: {
					fee,
					totalProfit,
					realizedPnL,
					unrealizedPnL,
					PnL: realizedPnL + unrealizedPnL,
				},
				statistics,
				buyCount,
				sellCount,
			};

			(order as any).summary = data;
		}
	});

	if (analyzeInDetails) {
		orders.forEach((order: any) => {
			order.summary.isMaxUnrealizedPnl =
				statistics.maxUnrealizedPnl == order.summary.pnl.unrealizedPnL;
			order.summary.isMaxPnl = statistics.maxPnl == order.summary.pnl.PnL;
			order.summary.isMinPnl = statistics.minPnl == order.summary.pnl.PnL;
		});
	}

	const unrealizedPnL = calculateUnrealizedPnl();
	const realizedPnL = totalProfit + fee;

	return {
		totalProfit,
		fee,
		realizedPnL,
		unrealizedPnL,
		PnL: realizedPnL + unrealizedPnL,
		statistics,
		buyCount,
		sellCount,
	};
}
