import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common';

interface IError {
	message: string;
	code_error: string;
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();

		const status =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR;

		const message =
			exception instanceof HttpException
				? (exception.getResponse() as IError)
				: { message: (exception as Error).message, code_error: null };

		const responseData: { statusCode: number; message: any } = {
			statusCode: status,
			message: null,
		};
		responseData.message = message.message || message;

		response.status(status).json(responseData);
	}
}
