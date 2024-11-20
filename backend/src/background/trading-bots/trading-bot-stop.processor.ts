import { IStopTradingBotQueueData } from '@/domain/interfaces/trading-bots/trading-bot-job.interface';
import { BotState } from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { QUEUES } from '@/infrastructure/services/bull/bull.const';
import { DefaultBullHandlers } from '@/infrastructure/services/bull/bull.handlers';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { TradingBotService } from '@/infrastructure/trading-bots/trading-bots.service';
import { Process, Processor } from '@nestjs/bull';
import { BadRequestException } from '@nestjs/common';
import { Job } from 'bull';

@Processor(QUEUES.TRADING_BOT_STOP)
export class TradingBotStopConsumer extends DefaultBullHandlers {
	constructor(
		readonly logger: LoggerService,
		private readonly tradingBotService: TradingBotService,
	) {
		super(logger);
	}

	@Process()
	async process(job: Job<IStopTradingBotQueueData>): Promise<any> {
		const { botId } = job.data;

		const botEntity = await this.tradingBotService.findBotById(botId);
		if (!botEntity) throw new BadRequestException('Бот не найден');

		await this.tradingBotService.update(botId, {
			state: BotState.Stopping,
		});

		return {};
	}
}
