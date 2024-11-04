import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { CreateBotConfigDto } from './dto/create-config.dto';
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

	async save(userId: number, dto: CreateBotConfigDto) {
		return await this.botConfigRepo.save({
			userId,
			...dto,
		});
	}

	async update(id: number, dto: CreateBotConfigDto) {
		return await this.botConfigRepo.update(id, {
			...dto,
		});
	}

	async delete(id: number) {
		return await this.botConfigRepo.delete(id);
	}
}
