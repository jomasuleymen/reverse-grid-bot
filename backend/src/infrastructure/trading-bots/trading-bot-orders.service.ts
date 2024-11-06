import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { TradingBotOrdersEntity } from './entities/trading-bot-orders.entity';

@Injectable()
export class TradingBotOrdersService {
	constructor(
		@InjectRepository(TradingBotOrdersEntity)
		private readonly botOrdersRepo: Repository<TradingBotOrdersEntity>,
	) {}

	async findByBotId(botId: number) {
		return await this.botOrdersRepo.find({
			where: { botId: Equal(botId) },
			order: { id: 'DESC' },
		});
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
