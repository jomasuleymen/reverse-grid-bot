import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { ValidationException } from "./common/exceptions/validation.exceptions";
import { AllExceptionFilter } from "./common/filter/exception.filter";
import { isInitTypeEnv, TYPE_ENV } from "./init";

export const configApp = async (app: INestApplication<any>) => {
	const configService = app.get<ConfigService>(ConfigService);

	app.setGlobalPrefix("api");
	app.useGlobalPipes(
		new ValidationPipe({
			exceptionFactory: errors => new ValidationException(errors),
			stopAtFirstError: true,
			whitelist: true,
			transform: true,
		}),
	);

	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
	app.useGlobalFilters(new AllExceptionFilter());


	const origins = configService.get("origins", "*");
	app.enableCors({
		origin: origins,
		credentials: true,
		exposedHeaders: [
			"Content-Disposition",
			"Content-Length",
			"Upload-Offset",
			"Upload-Length",
			"Content-Type",
		],
	});

	if (isInitTypeEnv(TYPE_ENV.FACE)) {
		const PORT = configService.getOrThrow<number>("SERVER_PORT");
		await app.listen(PORT, () => {
			console.log(`Server started on port ${PORT}`);
			console.log("Origins: ", origins);
			console.log("Environment:", process.env.NODE_ENV);
		});
	  } else {
		console.log('STARTED INIT');
		await app.init();
	  }


};