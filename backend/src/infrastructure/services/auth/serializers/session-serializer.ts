import { UserEntity } from '@/infrastructure/entities/account/user.entity';
import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UserSession } from '../dto/session-user.dto';

@Injectable()
export class SessionSerializer extends PassportSerializer {
	serializeUser(user: UserEntity, done: (err: any, user: any) => void): any {
		done(null, UserSession.fromUserDTO(user));
	}

	async deserializeUser(
		payload: UserSession,
		done: (err: any, payload: UserSession | null) => void,
	) {
		done(null, payload);
	}
}
