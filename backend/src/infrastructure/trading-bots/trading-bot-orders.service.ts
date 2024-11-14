import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { calculatePositionsSummary } from '../utils/trading-orders.util';
import { TradingBotOrdersEntity } from './entities/trading-bot-orders.entity';

@Injectable()
export class TradingBotOrdersService {
	constructor(
		@InjectRepository(TradingBotOrdersEntity)
		private readonly botOrdersRepo: Repository<TradingBotOrdersEntity>,
	) {}

	public async getWithSummary(botId: number) {
		const orders = await this.findByBotId(botId);
		return calculatePositionsSummary(orders, { includeDetails: true });
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
