import Joi from 'joi';

export const DEFAULT_NODE_ENV = 'development';

export const envConfigValidationSchema = Joi.object({
	NODE_ENV: Joi.string()
		.valid('development', 'production')
		.default(DEFAULT_NODE_ENV)
		.required(),
});
