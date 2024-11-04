import { TelegramAccountEntity } from '@/infrastructure/entities/notification/telegram-account.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

@Injectable()
export class TelegramAccountRepository {
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
