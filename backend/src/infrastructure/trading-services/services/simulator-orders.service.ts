import { DATABASES } from '@/configs/typeorm';
import { calculatePositionsSummary } from '@/infrastructure/utils/trading-orders.util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { TradingBotSimulatorOrderEntity } from '../entities/trading-bot-simulator-orders.service-entity';

@Injectable()
export class BotSimulatorOrdersService {
	constructor(
		@InjectRepository(TradingBotSimulatorOrderEntity, DATABASES.SERVICE_DB)
		private readonly ordersRepo: Repository<TradingBotSimulatorOrderEntity>,
	) {}

	public async getWithSummary(botId: number) {
		const orders = await this.findByBotId(botId);

		return calculatePositionsSummary(orders, {
			includeDetails: true,
		});
	}

	async findByBotId(botId: number) {
		const orders = await this.ordersRepo.find({
			where: { botId: Equal(botId) },
		});
		return orders;
	}

	async save(botId: number, orders: Partial<TradingBotSimulatorOrderEntity>) {
		return await this.ordersRepo.save({
			...orders,
			botId,
		});
	}
}
