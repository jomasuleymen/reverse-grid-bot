import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './infrastructure/common/filters/all-exception.filter';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	await app.init();

	console.log('APP STARTED');
}

bootstrap();
