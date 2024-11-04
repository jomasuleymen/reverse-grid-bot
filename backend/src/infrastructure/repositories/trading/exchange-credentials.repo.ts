import { ExchangeCredentialsEntity } from '@/infrastructure/entities/trading/exchang-credentials.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

@Injectable()
export class ExchangeCredentialsRepository {
	constructor(
		@InjectRepository(ExchangeCredentialsEntity)
		private readonly exchangeAccountsRepo: Repository<ExchangeCredentialsEntity>,
	) {}

	async findByUserId(
		userId: number,
		options: { createIfNotExists?: boolean } = {},
	) {
		let config = await this.exchangeAccountsRepo.findOneBy({
			userId: Equal(userId),
		});

		if (!config && options.createIfNotExists) {
			config = await this.save({ userId });
		}

		return config;
	}

	async save(payload: Partial<ExchangeCredentialsEntity>) {
		return await this.exchangeAccountsRepo.save(payload);
	}
}
