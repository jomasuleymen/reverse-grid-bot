import { TradingBotConfigEntity } from '@/infrastructure/entities/trading/trading-config.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

@Injectable()
export class BotConfigRepository {
	constructor(
		@InjectRepository(TradingBotConfigEntity)
		private readonly configRepo: Repository<TradingBotConfigEntity>,
	) {}

	async findByUserId(
		userId: number,
		options: { createIfNotExists?: boolean } = {},
	) {
		let config = await this.configRepo.findOneBy({
			userId: Equal(userId),
		});

		if (!config && options.createIfNotExists) {
			config = await this.save({ userId });
		}

		return config;
	}

	async save(payload: Partial<TradingBotConfigEntity>) {
		return await this.configRepo.save(payload);
	}
}
