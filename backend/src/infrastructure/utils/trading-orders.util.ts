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

interface IPnlStatistics {
	maxPnl: number;
	maxPnlIndex: number;
	minPnl: number;
	minPnlIndex: number;
}

interface IPnl {
	fee: number;
	unrealizedFees: number;
	totalProfit: number;
	realizedPnl: number;
	unrealizedPnl: number;
	netPnl: number;
}

interface PositionSummary {
	pnl: IPnl;
	statistics: IPnlStatistics;
	buyOrdersCount: number;
	sellOrdersCount: number;
	isMaxPnl?: boolean;
	isMinPnl?: boolean;
}

export type PostionsSummary<T> = PositionSummary & {
	positions: (PositionSummary & T)[];
};

export function calculatePositionsSummary<T extends CalculatePnlOrder>(
	orders: T[],
	options: IOptions = {},
): PostionsSummary<T> {
	const { includeDetails: includePositions = false } = options;

	const positions: PostionsSummary<T>['positions'] = [];
	const buyOrders: T[] = [];
	const sellOrders: T[] = [];

	let buyOrdersCount = 0;
	let sellOrdersCount = 0;
	let buyOrdersValue = 0;
	let sellOrdersValue = 0;
	let totalProfit = 0;
	let totalFees = 0;
	let feePercent = 0;

	if (orders.length) {
		const firstOrder = orders[0]!;
		feePercent =
			(firstOrder.fee / (firstOrder.avgPrice * firstOrder.quantity)) *
			100;
	}

	const statistics: IPnlStatistics = {
		maxPnl: orders.length ? Number.MIN_SAFE_INTEGER : 0,
		maxPnlIndex: 0,
		minPnl: orders.length ? Number.MAX_SAFE_INTEGER : 0,
		minPnlIndex: 0,
	};

	const currentPrice =
		options.currentPrice ||
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

	const calculateUnrealizedPnl = (positionPrice: number = currentPrice) => {
		const longUnrealizedPnl = buyOrders.reduce(
			(acc, order) =>
				acc + (positionPrice - order.avgPrice) * order.quantity,
			0,
		);

		const shortUnrealizedPnl = sellOrders.reduce(
			(acc, order) =>
				acc + (order.avgPrice - positionPrice) * order.quantity,
			0,
		);

		return longUnrealizedPnl + shortUnrealizedPnl;
	};

	orders.forEach((order, index) => {
		if (order.side === OrderSide.BUY) {
			buyOrdersCount++;
			buyOrdersValue += order.quantity;

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
			sellOrdersValue += order.quantity;

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

		totalFees += order.fee;

		const positionUnrealizedPnl = calculateUnrealizedPnl(order.avgPrice);
		const positionRealizedPnl = totalProfit - totalFees;
		const positionNetPnl = positionUnrealizedPnl + positionRealizedPnl;

		statistics.minPnl = Math.min(positionNetPnl, statistics.minPnl);
		statistics.maxPnl = Math.max(positionNetPnl, statistics.maxPnl);

		const remainCoinQuantity = Math.abs(buyOrdersValue - sellOrdersValue);
		const positionUnrealizedFees =
			(remainCoinQuantity * currentPrice * feePercent) / 100;

		if (includePositions) {
			positions.push({
				...order,
				pnl: {
					fee: totalFees,
					unrealizedFees: positionUnrealizedFees,
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
		positions.forEach((position, index) => {
			position.isMaxPnl = statistics.maxPnl === position.pnl.netPnl;
			position.isMinPnl = statistics.minPnl === position.pnl.netPnl;

			if (position.isMaxPnl) {
				statistics.maxPnlIndex = index + 1;
			}

			if (position.isMinPnl) {
				statistics.minPnlIndex = index + 1;
			}
		});
	}

	const unrealizedPnl = calculateUnrealizedPnl();
	const realizedPnl = totalProfit - totalFees;
	const netPnl = realizedPnl + unrealizedPnl;

	const remainCoinQuantity = Math.abs(buyOrdersValue - sellOrdersValue);
	const positionUnrealizedFees =
		(remainCoinQuantity * currentPrice * feePercent) / 100;

	return {
		positions,
		pnl: {
			totalProfit,
			fee: totalFees,
			unrealizedFees: positionUnrealizedFees,
			realizedPnl,
			unrealizedPnl,
			netPnl,
		},
		statistics,
		buyOrdersCount,
		sellOrdersCount,
	};
}
