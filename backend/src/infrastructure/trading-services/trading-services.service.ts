import { DATABASES } from '@/configs/typeorm';
import { IReverseGridBotSimulateQueueData } from '@/domain/interfaces/trading-bots/trading-bot-job.interface';
import { TradingBotSimulatorStatus } from '@/domain/interfaces/trading-services/trading-services.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Equal, Repository } from 'typeorm';
import { QUEUES } from '../services/bull/bull.const';
import { StartTradingBotSimulatorDto } from './dto/start-trading-bot-simulator.dto';
import { TradingBotSimulatorEntity } from './entities/trading-bot-simulator.service-entity';

@Injectable()
export class TradingServicesService {
	constructor(
		@InjectQueue(QUEUES.REVERSE_GRID_BOT_SIMULATE)
		private reverseGridBotSimulatorQueue: Queue<IReverseGridBotSimulateQueueData>,
		@InjectRepository(TradingBotSimulatorEntity, DATABASES.SERVICE_DB)
		private readonly tradingSimulatorConfigsRepo: Repository<TradingBotSimulatorEntity>,
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
			position: dto.position,
			status: TradingBotSimulatorStatus.Idle,
		});

		await this.reverseGridBotSimulatorQueue.add('start', {
			configId: configEntity.id,
		});
	}

	async findSimulators(userId: number) {
		return await this.tradingSimulatorConfigsRepo.find({
			order: {
				id: 'DESC',
			},
		});
	}

	async findSimulatorById(id: number) {
		return await this.tradingSimulatorConfigsRepo.findOne({
			where: { id: Equal(id) },
			relations: { stats: true },
		});
	}
}
