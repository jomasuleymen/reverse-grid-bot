import { IStopTradingBotQueueData } from '@/domain/interfaces/trading-bots/trading-bot-job.interface';
import { BotState } from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { QUEUES } from '@/infrastructure/services/bull/bull.const';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { TradingBotService } from '@/infrastructure/trading-bots/trading-bots.service';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor(QUEUES.TRADING_BOT_STOP)
export class TradingBotStopConsumer extends WorkerHost {
	constructor(
		private readonly loggerService: LoggerService,
		private readonly tradingBotService: TradingBotService,
	) {
		super();
	}

	async process(job: Job<IStopTradingBotQueueData>): Promise<any> {
		const { botId } = job.data;

		const botEntity = await this.tradingBotService.findBotById(botId);
		if (!botEntity) throw new BadRequestException('Бот не найден');

		await this.tradingBotService.update(botId, {
			state: BotState.Stopping,
		});

		return {};
	}

	@OnWorkerEvent('failed')
	async failed(failedReason: unknown) {
		this.loggerService.error(
			'Failed while stopping trading bot',
			failedReason,
		);
	}
}
