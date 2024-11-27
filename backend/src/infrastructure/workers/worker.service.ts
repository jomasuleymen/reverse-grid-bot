import { IStartTradingBotQueueData } from '@/domain/interfaces/trading-bots/trading-bot-job.interface';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { join } from 'path';
import { Worker } from 'worker_threads';
import LoggerService from '../services/logger/logger.service';

type WrokerType = 'trading-bot';

@Injectable()
export class WorkerService implements OnModuleDestroy {
	private workers: Worker[] = [];

	constructor(private readonly logger: LoggerService) {}

	createWorker(
		type: WrokerType,
		workerData: IStartTradingBotQueueData,
	): Worker {
		let workerPath;

		switch (type) {
			case 'trading-bot':
				workerPath = join(__dirname, './trading-bot-worker');
				break;
		}

		if (!workerPath) {
			throw new Error('Unknown worker type');
		}

		const worker = new Worker(workerPath, {
			workerData,
		});
		this.workers.push(worker);

		worker.on('error', (err) => {
			this.logger.error('Worker error', err);
		});

		worker.on('message', (message) => {
			this.logger.info('Message from worker', message);
		});

		worker.on('exit', (code) => {
			this.logger.info('Worker stopped', { code, workerData });
			this.workers = this.workers.filter((w) => w !== worker);
			this.logger.info('Active worker', { workers: this.workers });
		});

		return worker;
	}

	terminateWorker(worker: Worker): void {
		worker.terminate();
		this.workers = this.workers.filter((w) => w !== worker);
	}

	async onModuleDestroy() {
		for (const worker of this.workers) {
			await worker.terminate();
		}
	}
}
