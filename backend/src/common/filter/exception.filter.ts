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

		let responseData: Record<string, any> = {
			statusCode: status,
			message: exception?.message,
		};

		if (exception instanceof HttpException) {
			const exceptionResponse = exception.getResponse() as IError;

			if (typeof exceptionResponse === 'object') {
				responseData = {
					...responseData,
					...exceptionResponse,
				};
			} else {
				responseData = {
					...responseData,
					message: exceptionResponse,
				};
			}
		}

		response.status(status).json(responseData);
	}
}
