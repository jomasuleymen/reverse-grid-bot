import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { CreateCredentialsDto } from './dto/create-credentials.dto';
import { ExchangeCredentialsEntity } from './entites/exchange-credentials.entity';

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

	async save(userId: number, payload: CreateCredentialsDto) {
		return await this.exchangeCredentialsRepo.save({
			userId,
			...payload,
		});
	}

	async delete(id: number) {
		return await this.exchangeCredentialsRepo.delete(id);
	}
}
