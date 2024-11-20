import { DATABASES } from '@/configs/typeorm';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MainClient } from 'binance';
import sleep from 'sleep-promise';
import { SECOND } from 'time-constants';
import {
	And,
	Equal,
	LessThanOrEqual,
	MoreThanOrEqual,
	Repository,
} from 'typeorm';
import { KlineEntity } from '../entities/kline.service-entity';

@Injectable()
export class KlineService {
	private readonly binanceMainClient: MainClient;

	constructor(
		@InjectRepository(KlineEntity, DATABASES.SERVICE_DB)
		private readonly klineRepo: Repository<KlineEntity>,
		private readonly logger: LoggerService,
	) {
		this.binanceMainClient = new MainClient();
	}

	private formatTimestamp(timestamp: number): string {
		return new Date(timestamp).toISOString();
	}

	async fetchAndStoreKlines(
		symbol: string,
		startTime: number,
		endTime: number,
	): Promise<void> {
		this.logger.info('Fetching klines', {
			symbol,
			startTime: this.formatTimestamp(startTime),
			endTime: this.formatTimestamp(endTime),
		});

		let currentStartTime = startTime;
		const intervalDuration = 5000 * SECOND;

		try {
			while (currentStartTime < endTime) {
				const currentEndTime = Math.min(
					currentStartTime + intervalDuration,
					endTime,
				);

				const klinesBatch = await this.findInRange(
					symbol,
					currentStartTime,
					currentEndTime,
				);

				if (klinesBatch.length > 0) {
					const gaps = this.calculateGaps(
						klinesBatch,
						currentStartTime,
						currentEndTime,
					);

					for (const gap of gaps) {
						await this.fetchAndSaveInterval(
							symbol,
							gap.start,
							gap.end,
						);
					}
				} else {
					await this.fetchAndSaveInterval(
						symbol,
						currentStartTime,
						currentEndTime,
					);
				}

				currentStartTime = currentEndTime;

				await sleep(200);
			}
		} catch (err) {
			this.logger.error('FAILED fetch klines', err);
		}

		this.logger.info('Fetching klines completed', {
			symbol,
			startTime: this.formatTimestamp(startTime),
			endTime: this.formatTimestamp(endTime),
		});
	}

	private async fetchAndSaveInterval(
		symbol: string,
		startTime: number,
		endTime: number,
	) {
		let currentStartTime = startTime;

		while (currentStartTime < endTime) {
			let data = [];

			data = await this.binanceMainClient.getKlines({
				interval: '1s',
				symbol,
				startTime: currentStartTime,
				endTime,
				limit: 1000,
			});

			if (data.length === 0) break;

			const klines = data.map((kline: any) => ({
				symbol,
				openTime: kline[0],
				open: parseFloat(kline[1]),
				high: parseFloat(kline[2]),
				low: parseFloat(kline[3]),
				close: parseFloat(kline[4]),
				volume: parseFloat(kline[5]),
				closeTime: kline[6],
				quoteAssetVolume: parseFloat(kline[7]),
				numberOfTrades: kline[8],
				takerBuyBaseAssetVolume: parseFloat(kline[9]),
				takerBuyQuoteAssetVolume: parseFloat(kline[10]),
			}));

			await this.klineRepo
				.createQueryBuilder()
				.insert()
				.into(KlineEntity)
				.values(klines)
				.orIgnore() // On conflict do nothing
				.execute();

			this.logger.info('Saving fetched klines', {
				symbol,
				currentStartTime: this.formatTimestamp(currentStartTime),
				endTime: this.formatTimestamp(endTime),
				count: klines.length,
			});

			if (klines.length === 0) break;

			currentStartTime = klines[klines.length - 1]!.closeTime + 1;
			await sleep(400);
		}
	}

	private calculateGaps(
		existingKlines: KlineEntity[],
		startTime: number,
		endTime: number,
	) {
		const gaps = [];
		let currentStart = startTime;

		for (const kline of existingKlines) {
			if (kline.openTime > currentStart) {
				gaps.push({ start: currentStart, end: kline.openTime - 1 });
			}
			currentStart = kline.closeTime + 1;
		}

		if (currentStart < endTime) {
			gaps.push({ start: currentStart, end: endTime });
		}

		return gaps;
	}

	public async findInRange(
		symbol: string,
		startTime: number,
		endTime: number,
	) {
		return await this.klineRepo.find({
			where: {
				symbol: Equal(symbol),
				openTime: And(
					MoreThanOrEqual(startTime),
					LessThanOrEqual(endTime),
				),
			},
			order: { openTime: 'ASC' },
		});
	}
}
