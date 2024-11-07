import Joi from 'joi';

export const DEFAULT_NODE_ENV = 'development';

export const envConfigValidationSchema = Joi.object({
	NODE_ENV: Joi.string()
		.valid('development', 'production')
		.default(DEFAULT_NODE_ENV)
		.required(),

	SERVER_PORT: Joi.string().required(),

	REDIS_HOST: Joi.string().required(),
	REDIS_PORT: Joi.string().required(),
	REDIS_PASSWORD: Joi.string().required(),
});
