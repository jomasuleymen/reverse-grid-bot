import { RegisterQueueAsyncOptions } from '@nestjs/bullmq';

export const QUEUES = {
	TRADING_BOT_START: 'TRADING_BOT_START',
	TRADING_BOT_STOP: 'TRADING_BOT_STOP',
};

export const queueInjectionList = (): RegisterQueueAsyncOptions[] => {
	return Object.values(QUEUES).map((queue) => {
		return { name: queue };
	});
};

export type QueueKey = keyof typeof QUEUES;
