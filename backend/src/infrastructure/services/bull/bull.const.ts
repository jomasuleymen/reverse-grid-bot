import { RegisterQueueAsyncOptions } from '@nestjs/bullmq';

export const QUEUES = {
	TRADING_BOT_START: 'TRADING_BOT_START',
	TRADING_BOT_STOP: 'TRADING_BOT_STOP',
	REVERSE_GRID_BOT_SIMULATE: 'REVERSE_GRID_BOT_SIMULATE',
};

export const queueInjectionList = (): RegisterQueueAsyncOptions[] => {
	return Object.values(QUEUES).map((queue) => {
		return { name: queue };
	});
};

export type QueueKey = keyof typeof QUEUES;
