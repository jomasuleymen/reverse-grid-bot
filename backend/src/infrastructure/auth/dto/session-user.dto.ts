import { UserEntity } from '@/infrastructure/user/entities/user.entity';

export class UserSession implements Partial<UserEntity> {
	id: number;
	username: string;

	public static fromUserDTO(dto: UserEntity) {
		const session = new UserSession();
		session.id = dto.id;
		session.username = dto.username;

		return session;
	}
}
