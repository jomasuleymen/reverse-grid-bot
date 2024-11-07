import { RedisService } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import RedisStore from 'connect-redis';
import session, { Store } from 'express-session';
import { WEEK } from 'time-constants';

@Injectable()
export class SessionService {
	private readonly sessionStore: Store;
	private readonly sessionOptions: session.SessionOptions;

	constructor(
		private readonly redis: RedisService,
		private readonly config: ConfigService,
	) {
		this.sessionStore = new RedisStore({
			client: this.redis.getOrThrow(),
			prefix: 'sid:',
		});

		this.sessionOptions = {
			store: this.sessionStore,
			saveUninitialized: true,
			secret: this.config.get<string>('session.secret', 'secret'),
			resave: false,
			cookie: {
				sameSite: false,
				secure: false,
				httpOnly: false,
				maxAge: WEEK,
			},
		};
	}

	public getSessionOptions() {
		return this.sessionOptions;
	}
}
