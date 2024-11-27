import { Module, Provider } from '@nestjs/common';
import { WorkerService } from './worker.service';

const PROVIDERS: Provider[] = [WorkerService];

@Module({
	imports: [],
	controllers: [],
	providers: [...PROVIDERS],
	exports: [...PROVIDERS],
})
export class WorkersModule {}
