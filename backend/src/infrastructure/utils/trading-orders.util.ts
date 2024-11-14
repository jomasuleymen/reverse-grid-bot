import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import { TradingBotOrder } from '@/domain/interfaces/trading-bots/trading-bot.interface';

type CalculatePnlOrder = Pick<
	TradingBotOrder,
	'avgPrice' | 'side' | 'quantity' | 'fee'
>;

interface IOptions {
	currentPrice?: number;
	includeDetails?: boolean;
}

interface IStatistics {
	maxPnl: number;
	minPnl: number;
}

interface IPnl {
	fee: number;
	totalProfit: number;
	realizedPnl: number;
	unrealizedPnl: number;
	netPnl: number;
}

type PositionSummary = {
	pnl: IPnl;
	statistics: IStatistics;
	buyOrdersCount: number;
	sellOrdersCount: number;
	isMaxPnl?: boolean;
	isMinPnl?: boolean;
};

export type PostionsSummary<T> = PositionSummary & {
	positions: (PositionSummary & T)[];
};

export function calculatePositionsSummary<T extends CalculatePnlOrder>(
	orders: T[],
	options: IOptions = {},
): PostionsSummary<T> {
	const { includeDetails: includePositions = false, currentPrice = 0 } =
		options;

	const positions: PostionsSummary<T>['positions'] = [];
	const buyOrders: T[] = [];
	const sellOrders: T[] = [];

	let buyOrdersCount = 0;
	let sellOrdersCount = 0;
	let totalProfit = 0;
	let totalFees = 0;

	const statistics: IStatistics = {
		maxPnl: Number.MIN_SAFE_INTEGER,
		minPnl: Number.MAX_SAFE_INTEGER,
	};

	const effectiveCurrentPrice =
		currentPrice ||
		(orders.length ? orders[orders.length - 1]!.avgPrice : 0);

	const closePositionOrders = (
		stack: T[],
		orderPrice: number,
		orderQuantity: number,
		isLongPosition: boolean,
	) => {
		let totalPositionValue = 0;
		let totalClosedQuantity = 0;

		while (totalClosedQuantity < orderQuantity && stack.length > 0) {
			const positionOrder = stack.pop()!;
			const closeQuantity = Math.min(
				positionOrder.quantity,
				orderQuantity - totalClosedQuantity,
			);

			totalPositionValue += positionOrder.avgPrice * closeQuantity;
			totalClosedQuantity += closeQuantity;

			if (positionOrder.quantity > closeQuantity) {
				positionOrder.quantity -= closeQuantity;
				stack.push(positionOrder);
			}
		}

		if (totalClosedQuantity > 0) {
			const averagePositionPrice =
				totalPositionValue / totalClosedQuantity;
			const positionPnl =
				(isLongPosition
					? orderPrice - averagePositionPrice
					: averagePositionPrice - orderPrice) * totalClosedQuantity;
			totalProfit += positionPnl;
		}
	};

	const calculateUnrealizedPnl = (
		currentPrice: number = effectiveCurrentPrice,
	) => {
		const longUnrealizedPnl = buyOrders.reduce(
			(acc, order) =>
				acc + (currentPrice - order.avgPrice) * order.quantity,
			0,
		);

		const shortUnrealizedPnl = sellOrders.reduce(
			(acc, order) =>
				acc + (order.avgPrice - currentPrice) * order.quantity,
			0,
		);

		return longUnrealizedPnl + shortUnrealizedPnl;
	};

	orders.forEach((order) => {
		if (order.side === OrderSide.BUY) {
			buyOrdersCount++;
			if (sellOrders.length > 0) {
				closePositionOrders(
					sellOrders,
					order.avgPrice,
					order.quantity,
					false,
				);
			} else {
				buyOrders.push(order);
			}
		} else if (order.side === OrderSide.SELL) {
			sellOrdersCount++;
			if (buyOrders.length > 0) {
				closePositionOrders(
					buyOrders,
					order.avgPrice,
					order.quantity,
					true,
				);
			} else {
				sellOrders.push(order);
			}
		}

		totalFees -= order.fee;

		const positionUnrealizedPnl = calculateUnrealizedPnl(order.avgPrice);
		const positionRealizedPnl = totalProfit + totalFees;
		const positionNetPnl = positionUnrealizedPnl + positionRealizedPnl;

		statistics.minPnl = Math.min(positionNetPnl, statistics.minPnl);
		statistics.maxPnl = Math.max(positionNetPnl, statistics.maxPnl);

		if (includePositions) {
			positions.push({
				...order,
				pnl: {
					fee: totalFees,
					totalProfit,
					realizedPnl: positionRealizedPnl,
					unrealizedPnl: positionUnrealizedPnl,
					netPnl: positionNetPnl,
				},
				statistics,
				buyOrdersCount,
				sellOrdersCount,
			});
		}
	});

	if (includePositions) {
		positions.forEach((position) => {
			position.isMaxPnl = statistics.maxPnl === position.pnl.netPnl;
			position.isMinPnl = statistics.minPnl === position.pnl.netPnl;
		});
	}

	const unrealizedPnl = calculateUnrealizedPnl();
	const realizedPnl = totalProfit + totalFees;
	const netPnl = realizedPnl + unrealizedPnl;

	return {
		positions,
		pnl: {
			totalProfit,
			fee: totalFees,
			realizedPnl,
			unrealizedPnl,
			netPnl,
		},
		statistics,
		buyOrdersCount,
		sellOrdersCount,
	};
}
