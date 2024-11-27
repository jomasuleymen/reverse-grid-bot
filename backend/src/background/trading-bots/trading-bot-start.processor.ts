import { IStartTradingBotQueueData } from '@/domain/interfaces/trading-bots/trading-bot-job.interface';
import { QUEUES } from '@/infrastructure/services/bull/bull.const';
import { DefaultBullHandlers } from '@/infrastructure/services/bull/bull.handlers';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { WorkerService } from '@/infrastructure/workers/worker.service';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor(QUEUES.TRADING_BOT_START)
export class TradingBotStartConsumer extends DefaultBullHandlers {
	constructor(
		readonly logger: LoggerService,
		private readonly workersService: WorkerService,
	) {
		super(logger);
	}

	@Process()
	async process(job: Job<IStartTradingBotQueueData>): Promise<any> {
		const worker = this.workersService.createWorker(
			'trading-bot',
			job.data,
		);
	}
}
