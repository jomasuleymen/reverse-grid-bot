import { ConfigModuleOptions } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import Joi from 'joi';
import yaml from 'js-yaml';
import path from 'path';

const configDirPath = path.resolve('config');

const loadYamlFile = (
	fileName: string,
	throwError: boolean = false,
): Record<string, any> => {
	const filePath = path.join(configDirPath, fileName);

	// Check if the file exists before attempting to load
	if (existsSync(filePath)) {
		return yaml.load(readFileSync(filePath, 'utf8')) as Record<string, any>;
	}

	if (throwError) {
		throw new Error(`Config file not found: ${filePath}`);
	}

	return {};
};

export const getConfigModuleOptions = (): ConfigModuleOptions => {
	const DEFAULT_ENV = 'development';
	const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

	const loads: ConfigModuleOptions['load'] = [
		() => loadYamlFile('default.yaml'),
		() => loadYamlFile(`${nodeEnv}.yaml`),
	];

	return {
		envFilePath: '.env',
		load: loads,
		isGlobal: true,
		validationSchema: Joi.object({
			NODE_ENV: Joi.string()
				.valid('development', 'production')
				.default(DEFAULT_ENV)
				.required(),
		}),
		validationOptions: {
			abortEarly: true,
		},
	};
};
