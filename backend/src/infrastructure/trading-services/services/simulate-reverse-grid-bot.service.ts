import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import {
	ITradingBotConfig,
	TradePosition,
} from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { IBotSimulatorOrder } from '@/domain/interfaces/trading-services/trading-services.interface';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { Injectable } from '@nestjs/common';
import { SECOND } from 'time-constants';
import { KlineService } from './kline-service.service';
@Injectable()
export class SimulateReverseGridBotService {
	constructor(
		private readonly klineService: KlineService,
		private readonly logger: LoggerService,
	) {}

	private async fetchAndStoreKlines(
		symbol: string,
		startTime: number,
		endTime: number,
	) {
		await this.klineService.fetchAndStoreKlines(symbol, startTime, endTime);
	}

	async simulateReverseGridBot(
		config: ITradingBotConfig,
		startTime: number,
		endTime: number,
	) {
		const symbol = config.baseCurrency + config.quoteCurrency;
		await this.fetchAndStoreKlines(symbol, startTime, endTime);

		const bot = new ReverseGridBotSimulator(config);
		const stats = new TradingBotSimulatorStats();

		let currentStartTime = startTime;
		const intervalDuration = 5000 * SECOND;

		let linesCount = 0;

		while (currentStartTime < endTime) {
			const currentEndTime = Math.min(
				currentStartTime + intervalDuration,
				endTime,
			);

			const klines = await this.klineService.findInRange(
				symbol,
				currentStartTime,
				currentEndTime,
			);

			linesCount += klines.length;

			for (let kline of klines) {
				stats.onPriceUpdate(kline.open);
				bot.onPriceUpdate(kline.open, kline.openTime);
			}

			currentStartTime = currentEndTime;
		}

		bot.closeAllPositions(stats.closePrice);

		return {
			stats,
			orders: bot.orders,
		};
	}
}

class TradingBotSimulatorStats {
	public openPrice = 0;
	public closePrice = 0;
	public highestPrice = Number.MIN_SAFE_INTEGER;
	public lowestPrice = Number.MAX_SAFE_INTEGER;

	public onPriceUpdate(price: number) {
		if (!this.openPrice) this.openPrice = price;
		this.highestPrice = Math.max(this.highestPrice, price);
		this.lowestPrice = Math.min(this.lowestPrice, price);
		this.closePrice = price;
	}
}

class ReverseGridBotSimulator {
	public orders: IBotSimulatorOrder[] = [];
	private stopOrdersStack: number[] = [];
	private feePercent = 0.1;
	private stopOrderTriggerPrice = 0;
	private stopLossTriggerPrice = 0;

	private StopOrderSide = OrderSide.BUY;
	private StopLossSide = OrderSide.SELL;

	constructor(private readonly config: ITradingBotConfig) {
		if (this.config.position === TradePosition.SHORT) {
			this.StopOrderSide = OrderSide.SELL;
			this.StopLossSide = OrderSide.BUY;
			this.config.gridStep *= -1;
		}
	}

	public onPriceUpdate(price: number, opentime: number) {
		const isTrade =
			this.config.position === TradePosition.LONG
				? price >= this.stopOrderTriggerPrice ||
					price <= this.stopLossTriggerPrice
				: price <= this.stopOrderTriggerPrice ||
					price >= this.stopLossTriggerPrice;

		if (isTrade) {
			const side = (
				this.config.position === TradePosition.LONG
					? price >= this.stopOrderTriggerPrice
					: price <= this.stopOrderTriggerPrice
			)
				? this.StopOrderSide
				: this.StopLossSide;
			const triggerPrice =
				side === this.StopOrderSide
					? this.stopOrderTriggerPrice
					: this.stopLossTriggerPrice;
			this.trade(side, price, triggerPrice, opentime);
		}
	}

	private trade(
		side: OrderSide,
		currentPrice: number,
		triggerPrice: number,
		opentime: number,
	) {
		triggerPrice = triggerPrice || currentPrice;
		this.updateTriggers(triggerPrice);

		const fee = this.calculateFee(currentPrice, this.config.gridVolume);

		if (side === this.StopOrderSide) {
			this.stopOrdersStack.push(currentPrice);
			this.orders.push(
				this.createOrder(
					side,
					currentPrice,
					fee,
					triggerPrice,
					opentime,
				),
			);
		} else if (this.stopOrdersStack.length > 0) {
			this.stopOrdersStack.pop();
			this.orders.push(
				this.createOrder(
					side,
					currentPrice,
					fee,
					triggerPrice,
					opentime,
				),
			);
		}
	}

	public closeAllPositions(currentPrice: number) {
		if (this.orders.length === 0) return;

		const closeSide =
			this.config.position === TradePosition.LONG
				? OrderSide.SELL
				: OrderSide.BUY;

		const orderTime =
			this.orders[this.orders.length - 1]!.createdDate.getTime();

		const allRemainAmount =
			this.stopOrdersStack.length * this.config.gridVolume;

		const fee = this.calculateFee(currentPrice, allRemainAmount);

		this.orders.push(
			this.createOrder(
				closeSide,
				currentPrice,
				fee,
				0,
				orderTime,
				allRemainAmount,
			),
		);

		// Reset triggers and clean state
		this.stopOrdersStack = [];
		this.stopOrderTriggerPrice = 0;
		this.stopLossTriggerPrice = 0;
	}

	private updateTriggers(triggerPrice: number) {
		this.stopOrderTriggerPrice = triggerPrice + this.config.gridStep;
		this.stopLossTriggerPrice = triggerPrice - this.config.gridStep;
	}

	private calculateFee(currentPrice: number, volume: number): number {
		return (volume * currentPrice * this.feePercent) / 100;
	}

	private createOrder(
		side: OrderSide,
		currentPrice: number,
		fee: number,
		triggerPrice: number,
		opentime: number,
		quantity: number = this.config.gridVolume,
	): IBotSimulatorOrder {
		return {
			side,
			quantity,
			avgPrice: currentPrice,
			fee,
			createdDate: new Date(opentime),
			feeCurrency: this.config.quoteCurrency,
			triggerPrice,
		};
	}
}
