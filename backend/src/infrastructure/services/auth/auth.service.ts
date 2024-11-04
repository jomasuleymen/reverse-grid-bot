import { LoginFailedException } from '@/infrastructure/common/exceptions/auth.exceptions';
import { UserEntity } from '@/infrastructure/entities/account/user.entity';
import { UserRepository } from '@/infrastructure/repositories/account/user.repo';
import { compareHash, hashPlainText } from '@/infrastructure/utils/hash.util';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
	constructor(private readonly userRepo: UserRepository) {}

	async validateLocalUser(
		username: string,
		password: string,
	): Promise<UserEntity> {
		const user = await this.userRepo.findByUsername(username);
		if (!user || !user.password) throw new LoginFailedException();

		const isPasswordCorrect = compareHash(password, user.password);
		if (!isPasswordCorrect) throw new LoginFailedException();

		return user;
	}
}
