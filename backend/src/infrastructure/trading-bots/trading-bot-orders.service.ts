import { BotState } from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { BybitService } from '../exchanges/modules/bybit/bybit.service';
import { calculatePositionsSummary } from '../utils/trading-orders.util';
import { TradingBotOrdersEntity } from './entities/trading-bot-orders.entity';
import { TradingBotService } from './trading-bots.service';

@Injectable()
export class TradingBotOrdersService {
	constructor(
		@InjectRepository(TradingBotOrdersEntity)
		private readonly botOrdersRepo: Repository<TradingBotOrdersEntity>,
		private readonly botService: TradingBotService,
		private readonly bybitService: BybitService,
	) {}

	public async getWithSummary(botId: number) {
		const bot = await this.botService.findBotById(botId);

		if (!bot) {
			throw new BadRequestException('Bot not found');
		}

		const orders = await this.findByBotId(botId);

		let currentPrice;
		if (bot.state === BotState.Running) {
			currentPrice = await this.bybitService.getTickerLastPrice(
				'spot',
				bot.baseCurrency + bot.quoteCurrency,
			);
		}

		return calculatePositionsSummary(orders, {
			includeDetails: true,
			currentPrice,
		});
	}

	async findByBotId(botId: number) {
		const orders = await this.botOrdersRepo.find({
			where: { botId: Equal(botId) },
		});
		return orders;
	}

	async save(botId: number, dto: Partial<TradingBotOrdersEntity>) {
		return await this.botOrdersRepo.save({
			...dto,
			botId,
		});
	}

	async update(id: number, dto: Partial<TradingBotOrdersEntity>) {
		return await this.botOrdersRepo.update(id, {
			...dto,
		});
	}
}
