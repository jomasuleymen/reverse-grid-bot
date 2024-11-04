import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { ExchangeCredentialsEntity } from './entities/exchang-credentials.entity';

@Injectable()
export class ExchangeCredentialsService {
	constructor(
		@InjectRepository(ExchangeCredentialsEntity)
		private readonly exchangeCredentialsRepo: Repository<ExchangeCredentialsEntity>,
	) {}

	async findById(id: number) {
		return await this.exchangeCredentialsRepo.findOneBy({
			id: Equal(id),
		});
	}

	async findByUserId(userId: number) {
		return await this.exchangeCredentialsRepo.findBy({
			userId: Equal(userId),
		});
	}

	async save(payload: Partial<ExchangeCredentialsEntity>) {
		return await this.exchangeCredentialsRepo.save(payload);
	}
}
