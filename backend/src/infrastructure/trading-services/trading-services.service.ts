import { DATABASES } from '@/configs/typeorm';
import { IReverseGridBotSimulateQueueData } from '@/domain/interfaces/trading-bots/trading-bot-job.interface';
import { TradingBotSimulatorStatus } from '@/domain/interfaces/trading-services/trading-services.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUES } from '../services/bull/bull.const';
import { StartTradingBotSimulatorDto } from './dto/start-trading-bot-simulator.dto';
import { ReverseGridBotConfigEntity } from './entities/reverse-grid-bot-configs.service-entity';

@Injectable()
export class TradingServicesService {
	constructor(
		@InjectQueue(QUEUES.REVERSE_GRID_BOT_SIMULATE)
		private reverseGridBotSimulatorQueue: Queue<IReverseGridBotSimulateQueueData>,
		@InjectRepository(ReverseGridBotConfigEntity, DATABASES.SERVICE_DB)
		private readonly tradingSimulatorConfigsRepo: Repository<ReverseGridBotConfigEntity>,
	) {}

	async addReverseGridBotSimulatorTask(
		userId: number,
		dto: StartTradingBotSimulatorDto,
	) {
		const configEntity = await this.tradingSimulatorConfigsRepo.save({
			endTime: dto.endTime,
			startTime: dto.startTime,
			gridStep: dto.gridStep,
			gridVolume: dto.gridVolume,
			baseCurrency: dto.baseCurrency,
			quoteCurrency: dto.quoteCurrency,

			status: TradingBotSimulatorStatus.Idle,
		});

		await this.reverseGridBotSimulatorQueue.add('start', {
			configId: configEntity.id,
		});
	}

	async findSimulatorResults(userId: number) {
		return await this.tradingSimulatorConfigsRepo.find({
			relations: { result: true },
			order: {
				id: 'DESC',
			},
		});
	}
}
