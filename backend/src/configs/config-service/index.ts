import { ConfigModuleOptions } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import {
	DEFAULT_NODE_ENV,
	envConfigValidationSchema,
} from './validation-schema';

const configDirPath = path.resolve('config');

const loadYamlFile = (fileName: string): Record<string, any> => {
	const filePath = path.join(configDirPath, fileName);

	if (existsSync(filePath)) {
		return yaml.load(readFileSync(filePath, 'utf8')) as Record<string, any>;
	}

	return {};
};

export const getConfigModuleOptions = (): ConfigModuleOptions => {
	const nodeEnv = process.env.NODE_ENV || DEFAULT_NODE_ENV;

	const loads: ConfigModuleOptions['load'] = [
		() => loadYamlFile('default.yaml'),
		() => loadYamlFile(`${nodeEnv}.yaml`),
	];

	return {
		envFilePath: '.env',
		load: loads,
		isGlobal: true,
		validationSchema: envConfigValidationSchema,
		validationOptions: {
			abortEarly: true,
		},
	};
};
