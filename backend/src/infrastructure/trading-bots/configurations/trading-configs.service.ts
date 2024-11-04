import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { TradingBotConfigEntity } from './entities/trading-config.entity';

@Injectable()
export class TradingBotConfigsService {
	constructor(
		@InjectRepository(TradingBotConfigEntity)
		private readonly botConfigRepo: Repository<TradingBotConfigEntity>,
	) {}

	async findById(id: number) {
		return await this.botConfigRepo.findOneBy({
			id: Equal(id),
		});
	}

	async findByUserId(userId: number) {
		return await this.botConfigRepo.findBy({
			userId: Equal(userId),
		});
	}

	async save(payload: Partial<TradingBotConfigEntity>) {
		return await this.botConfigRepo.save(payload);
	}
}
