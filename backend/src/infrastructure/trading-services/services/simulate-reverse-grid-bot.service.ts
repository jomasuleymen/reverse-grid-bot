import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import { ITradingBotConfig } from '@/domain/interfaces/trading-bots/trading-bot.interface';
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

	async simulateReverseGridBot(
		config: ITradingBotConfig,
		startTime: number,
		endTime: number,
	) {
		const symbol = config.baseCurrency + config.quoteCurrency;
		await this.klineService.fetchAndStoreKlines(symbol, startTime, endTime);

		const tradingSimulator = new ReverseGridBotSimulator(config);

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
				tradingSimulator.onPriceUpdate(kline.open);
			}

			currentStartTime = currentEndTime;
		}

		return tradingSimulator.getSummary();
	}
}

class ReverseGridBotSimulator {
	// Trading counts and amount
	private buyCount = 0;
	private sellCount = 0;
	private positionAmount = 0;

	// Price tracking variables
	private openPrice = 0;
	private currentPrice = 0;
	private highestPrice = 0;
	private lowestPrice = 1_000_000_000;

	private buyStack: number[] = [];

	// PnL and fee variables

	private exchangeRates = {
		feePercent: 0.1,
	};

	private totalProfit = 0;
	private totalFee = 0;
	private realizedPnL = 0;
	private unrealizedPnL = 0;
	private PnL = 0;

	private maxPnL = 0;

	// Trigger and stop loss levels
	private topTrigger = 0;
	private bottomTrigger = 0;

	constructor(private readonly config: ITradingBotConfig) {}

	public onPriceUpdate(price: number) {
		this.lowestPrice = Math.min(this.lowestPrice, price);
		this.highestPrice = Math.max(this.highestPrice, price);

		if (!this.openPrice) this.openPrice = price;
		this.currentPrice = price;

		if (price >= this.topTrigger) {
			this.trade(OrderSide.BUY, this.topTrigger);
		} else if (price <= this.bottomTrigger) {
			this.trade(OrderSide.SELL, this.bottomTrigger);
		}

		this.updatePnL(price);
	}

	private trade(side: OrderSide, triggerPrice: number) {
		triggerPrice = triggerPrice || this.currentPrice;

		this.topTrigger = triggerPrice + this.config.gridStep;
		this.bottomTrigger = triggerPrice - this.config.gridStep;

		const fee =
			(this.config.gridVolume *
				this.currentPrice *
				this.exchangeRates.feePercent) /
			100;
		this.totalFee -= fee;

		if (side === OrderSide.BUY) {
			this.buyCount++;
			this.positionAmount += this.config.gridVolume;
			this.buyStack.push(this.currentPrice);
		} else if (this.positionAmount >= this.config.gridVolume) {
			const lastBoughtPrice = this.buyStack.pop();

			if (lastBoughtPrice) {
				this.sellCount++;
				this.positionAmount -= this.config.gridVolume;

				this.totalProfit +=
					(this.currentPrice - lastBoughtPrice) *
					this.config.gridVolume;
			}
		}
	}

	private updatePnL(price: number) {
		this.realizedPnL = this.totalProfit + this.totalFee;
		this.unrealizedPnL = this.buyStack.reduce(
			(prev, curr) => prev + (price - curr) * this.config.gridVolume,
			0,
		);
		this.PnL = this.realizedPnL + this.unrealizedPnL;

		this.maxPnL = Math.max(this.PnL, this.maxPnL);
	}

	public getSummary() {
		return {
			buyCount: this.buyCount,
			sellCount: this.sellCount,
			openPrice: this.openPrice,
			closePrice: this.currentPrice,
			highestPrice: this.highestPrice,
			lowestPrice: this.lowestPrice,
			totalProfit: this.totalProfit,
			totalFee: this.totalFee,
			realizedPnL: this.realizedPnL,
			unrealizedPnL: this.unrealizedPnL,
			PnL: this.PnL,
			maxPnL: this.maxPnL,
		};
	}
}
