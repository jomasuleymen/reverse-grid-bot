import { getRedisOptions } from '@/configs/redis';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { queueInjectionList } from './bull.const';

@Module({
	imports: [
		BullModule.forRootAsync({
			imports: [],
			inject: [ConfigService],
			useFactory: async (config: ConfigService) => ({
				redis: {
					...getRedisOptions(config),
				},
				defaultJobOptions: {
					removeOnComplete: true,
					removeOnFail: true,
				},
			}),
		}),
		BullModule.registerQueue(...queueInjectionList()),
	],
	providers: [],
	exports: [BullModule],
})
export class BullServiceModule {}
