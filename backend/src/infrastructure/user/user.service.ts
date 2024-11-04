import { UserEntity } from '@/infrastructure/user/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepo: Repository<UserEntity>,
	) {}

	async findById(id: number) {
		return this.userRepo.findOneBy({ id: Equal(id) });
	}

	async findByUsername(username: string) {
		return this.userRepo.findOneBy({ username: Equal(username) });
	}

	async saveUser(payload: Partial<UserEntity>) {
		return await this.userRepo.save(payload);
	}
}
