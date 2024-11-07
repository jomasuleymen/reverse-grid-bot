import { getRedisOptions } from '@/configs/redis';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { queueInjectionList } from './bull.const';

@Module({
	imports: [
		BullModule.forRootAsync({
			imports: [],
			inject: [ConfigService],
			useFactory: async (config: ConfigService) => ({
				connection: {
					...getRedisOptions(config),
				},
				defaultJobOptions: {
					removeOnComplete: true,
					removeOnFail: true,
				},
				prefix: 'TRADING_BOT',
			}),
		}),
		BullModule.registerQueue(...queueInjectionList()),
	],
	providers: [],
	exports: [BullModule],
})
export class BullServiceModule {}
