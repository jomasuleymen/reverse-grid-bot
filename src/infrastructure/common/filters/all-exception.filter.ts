import { TelegramService } from '@/infrastructure/services/telegram/telegram.service';
import {
	ArgumentsHost,
	Catch,
	ExceptionFilter
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	constructor(private readonly telegramService: TelegramService) {}

	catch(exception: unknown, host: ArgumentsHost) {
		// Optionally log error details to console or external service
		console.error('Unhandled exception:', exception);

		console.log(host);

		// // Handle request safely
		// if (host.getType() === 'http') {
		// 	const ctx = host.switchToHttp();
		// 	const response = ctx.getResponse();
		// 	const status =
		// 		exception instanceof HttpException
		// 			? exception.getStatus()
		// 			: 500;

		// 	response.status(status).json({
		// 		statusCode: status,
		// 		message:
		// 			'An unexpected error occurred. Please try again later.',
		// 	});
		// } else if (host.getType() === 'rpc') {
		// 	// Handle RPC errors
		// } else if (host.getType() === 'ws') {
		// 	// Handle WebSocket errors
		// }

		// You could send a message via TelegramService to log the error as well, if needed
	}
}
