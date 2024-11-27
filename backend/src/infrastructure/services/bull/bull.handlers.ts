import {
	OnQueueActive,
	OnQueueCompleted,
	OnQueueError,
	OnQueueFailed,
	OnQueueRemoved,
	OnQueueStalled,
} from '@nestjs/bull';
import { Job } from 'bull';
import LoggerService from '../logger/logger.service';

export class DefaultBullHandlers {
	constructor(readonly logger: LoggerService) {}

	@OnQueueError()
	error(err: Error) {
		this.logger.error(`Task errored`, err);
	}

	@OnQueueFailed()
	failed(job: Job, err: Error) {
		this.logger.error(`Task failed`, {
			queue: job.queue.name,
			jobId: job.id,
			data: job.data,
			err,
		});
	}

	@OnQueueRemoved()
	removed(job: Job) {
		this.logger.info(`Task removed`, {
			queue: job.queue.name,
			jobId: job.id,
			data: job.data,
		});
	}

	@OnQueueStalled()
	stalled(job: Job) {
		this.logger.error(`Task stalled`, {
			queue: job.queue.name,
			jobId: job.id,
			data: job.data,
		});
	}

	@OnQueueActive()
	active(job: Job) {
		this.logger.info(`Task started`, {
			queue: job.queue.name,
			jobId: job.id,
			data: job.data,
		});
	}
}
