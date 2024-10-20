import { ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';

export const getConfigModuleOptions = (): ConfigModuleOptions => {
	return {
		envFilePath: '.env',
		isGlobal: true,
		validationSchema: Joi.object({
			NODE_ENV: Joi.string()
				.valid('development', 'production')
				.default('development')
				.required(),

			BINANCE_API_KEY: Joi.string().required(),
			BINANCE_SECRET_KEY: Joi.string().required(),
		}),
		validationOptions: {
			abortEarly: true,
		},
	};
};
