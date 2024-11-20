import { DATABASES } from '@/configs/typeorm';
import { IReverseGridBotSimulateQueueData } from '@/domain/interfaces/trading-bots/trading-bot-job.interface';
import { TradingBotSimulatorStatus } from '@/domain/interfaces/trading-services/trading-services.interface';
import { QUEUES } from '@/infrastructure/services/bull/bull.const';
import { DefaultBullHandlers } from '@/infrastructure/services/bull/bull.handlers';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { TradingBotSimulatorEntity } from '@/infrastructure/trading-services/entities/trading-bot-simulator.service-entity';
import { SimulateReverseGridBotService } from '@/infrastructure/trading-services/services/simulate-reverse-grid-bot.service';
import { Process, Processor } from '@nestjs/bull';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Equal, Repository } from 'typeorm';

@Processor(QUEUES.REVERSE_GRID_BOT_SIMULATE)
export class ReverseGridBotSimulateConsumer extends DefaultBullHandlers {
	constructor(
		readonly logger: LoggerService,
		private readonly simulatorService: SimulateReverseGridBotService,
		@InjectRepository(TradingBotSimulatorEntity, DATABASES.SERVICE_DB)
		private readonly botSimulatorsRepo: Repository<TradingBotSimulatorEntity>,
	) {
		super(logger);
	}

	@Process({ concurrency: 1 })
	async process(job: Job<IReverseGridBotSimulateQueueData>): Promise<any> {
		const { configId } = job.data;

		const botConfigs = await this.botSimulatorsRepo.findOne({
			where: {
				id: Equal(configId),
			},
			relations: {
				stats: true,
			},
		});

		if (!botConfigs) {
			throw new BadRequestException('Configuration for bot now found');
		}

		const {
			baseCurrency,
			quoteCurrency,
			gridStep,
			gridVolume,
			startTime,
			endTime,
			position,
		} = botConfigs;

		await this.botSimulatorsRepo.update(botConfigs.id, {
			status: TradingBotSimulatorStatus.InProgress,
		});

		const { stats, orders } =
			await this.simulatorService.simulateReverseGridBot(
				{
					baseCurrency,
					quoteCurrency,
					gridVolume,
					gridStep,
					position,
				},
				startTime,
				endTime,
			);

		return await this.botSimulatorsRepo.save({
			id: botConfigs.id,
			status: TradingBotSimulatorStatus.Completed,
			stats: {
				openPrice: stats.openPrice,
				highestPrice: stats.highestPrice,
				lowestPrice: stats.lowestPrice,
				closePrice: stats.closePrice,
			},
			orders,
		});
	}
}
