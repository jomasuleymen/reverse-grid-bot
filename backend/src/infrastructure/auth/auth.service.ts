import { LoginFailedException } from '@/common/exceptions/auth.exceptions';
import { UserEntity } from '@/infrastructure/user/entities/user.entity';
import { compareHash } from '@/infrastructure/utils/hash.util';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
	constructor(private readonly usreService: UserService) {}

	async validateLocalUser(
		username: string,
		password: string,
	): Promise<UserEntity> {
		const user = await this.usreService.findByUsername(username);
		if (!user || !user.password) throw new LoginFailedException();

		const isPasswordCorrect = compareHash(password, user.password);
		if (!isPasswordCorrect) throw new LoginFailedException();

		return user;
	}
}
