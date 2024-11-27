import { NestFactory } from '@nestjs/core';
import { workerData } from 'worker_threads';
import { TradingBotWorkerModule } from './trading-bot-worker.module';
import { TradingBotWorkerService } from './trading-bot-worker.service';

(async () => {
	const app = await NestFactory.createApplicationContext(
		TradingBotWorkerModule,
	);
	const tradingBotWorkerService = app.get(TradingBotWorkerService);
	tradingBotWorkerService.startBot(workerData);
})();
