import { DATABASES } from '@/configs/typeorm';
import { IReverseGridBotSimulateQueueData } from '@/domain/interfaces/trading-bots/trading-bot-job.interface';
import { TradingBotSimulatorStatus } from '@/domain/interfaces/trading-services/trading-services.interface';
import { QUEUES } from '@/infrastructure/services/bull/bull.const';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { ReverseGridBotConfigEntity } from '@/infrastructure/trading-services/entities/reverse-grid-bot-configs.service-entity';
import { ReverseGridBotStatsEntity } from '@/infrastructure/trading-services/entities/reverse-grid-bot-stats.service-entity';
import { SimulateReverseGridBotService } from '@/infrastructure/trading-services/services/simulate-reverse-grid-bot.service';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Equal, IsNull, Not, Repository } from 'typeorm';

@Processor(QUEUES.REVERSE_GRID_BOT_SIMULATE, { concurrency: 1 })
export class ReverseGridBotSimulateConsumer extends WorkerHost {
	constructor(
		private readonly loggerService: LoggerService,
		private readonly simulatorService: SimulateReverseGridBotService,
		@InjectRepository(ReverseGridBotStatsEntity, DATABASES.SERVICE_DB)
		private readonly statsRepo: Repository<ReverseGridBotStatsEntity>,
		@InjectRepository(ReverseGridBotConfigEntity, DATABASES.SERVICE_DB)
		private readonly tradingSimulatorConfigsRepo: Repository<ReverseGridBotConfigEntity>,
	) {
		super();
	}

	async process(job: Job<IReverseGridBotSimulateQueueData>): Promise<any> {
		const { configId } = job.data;

		const config = await this.tradingSimulatorConfigsRepo.findOne({
			where: {
				id: Equal(configId),
			},
			relations: {
				result: true,
			},
		});

		if (!config) {
			throw new BadRequestException('Configuration now found');
		}

		const {
			baseCurrency,
			quoteCurrency,
			gridStep,
			gridVolume,
			startTime,
			endTime,
			status,
		} = config;

		const alreadyProcessedSameConfig =
			await this.tradingSimulatorConfigsRepo.findOne({
				where: {
					baseCurrency,
					quoteCurrency,
					startTime,
					endTime,
					gridStep: config.gridStep,
					gridVolume: config.gridVolume,
					result: Not(IsNull()),
					status: TradingBotSimulatorStatus.Completed,
				},
				relations: {
					result: true,
				},
			});

		if (alreadyProcessedSameConfig) {
			return await this.tradingSimulatorConfigsRepo.save({
				id: config.id,
				status: TradingBotSimulatorStatus.Completed,
				result: alreadyProcessedSameConfig.result,
			});
		}

		await this.tradingSimulatorConfigsRepo.update(config.id, {
			status: TradingBotSimulatorStatus.InProgress,
		});

		const result = await this.simulatorService.simulateReverseGridBot(
			{
				baseCurrency,
				quoteCurrency,
				gridVolume,
				gridStep,
				takeProfitOnGrid: 0,
			},
			startTime,
			endTime,
		);

		const entity: Omit<ReverseGridBotStatsEntity, 'id' | 'createdAt'> = {
			buyCount: result.buyCount,
			closePrice: result.closePrice,
			highestPrice: result.highestPrice,
			lowestPrice: result.lowestPrice,
			maxPnL: result.maxPnL,
			openPrice: result.openPrice,
			PnL: result.PnL,
			realizedPnL: result.realizedPnL,
			sellCount: result.sellCount,
			totalFee: result.totalFee,
			totalProfit: result.totalProfit,
			unrealizedPnL: result.unrealizedPnL,
			configs: [config],
		};

		const resultEntity = await this.statsRepo.save(entity);

		return await this.tradingSimulatorConfigsRepo.save({
			id: config.id,
			status: TradingBotSimulatorStatus.Completed,
			result: resultEntity,
		});
	}

	@OnWorkerEvent('error')
	async error(failedReason: unknown) {
		this.loggerService.error(
			'Failed while simulating the reverse grid bot',
			failedReason,
		);
	}
}
