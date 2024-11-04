import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { TelegramAccountEntity } from './entities/telegram-account.entity';

@Injectable()
export class TelegramPreferencesService {
	constructor(
		@InjectRepository(TelegramAccountEntity)
		private readonly tgAccountRepo: Repository<TelegramAccountEntity>,
	) {}

	async findByUserId(userId: number) {
		return this.tgAccountRepo.findOne({
			where: { userId: Equal(userId) },
			relations: { user: true },
		});
	}

	async findByTelegramUserId(userId: number) {
		return this.tgAccountRepo.findOne({
			where: { telegramUserId: Equal(userId) },
			relations: { user: true },
		});
	}

	async save(payload: Partial<TelegramAccountEntity>) {
		return await this.tgAccountRepo.save(payload);
	}
}
