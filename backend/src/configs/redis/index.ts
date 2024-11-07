import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const getRedisOptions = (config: ConfigService): RedisOptions => {
	return {
		host: config.getOrThrow('REDIS_HOST'),
		port: Number(config.getOrThrow('REDIS_PORT')),
		password: config.getOrThrow('REDIS_PASSWORD'),
	};
};
