import { UserEntity } from '@/infrastructure/entities/account/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

@Injectable()
export class UserRepository {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepo: Repository<UserEntity>,
	) {}

	async findById(id: number) {
		return this.userRepo.findOneBy({ id: Equal(id) });
	}

	async findByChatId(chatId: number) {
		return this.userRepo.findOneBy({ chatId: Equal(chatId) });
	}

	async findByTelegramUserId(userId: number) {
		return this.userRepo.findOneBy({ telegramUserId: Equal(userId) });
	}

	async saveUser(payload: Partial<UserEntity>) {
		return await this.userRepo.save(payload);
	}
}
