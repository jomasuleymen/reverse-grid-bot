import dotenv from 'dotenv';
dotenv.config();

export enum TYPE_ENV {
	FACE = 'FACE',
	REVERSE_GRID_BOTS = 'REVERSE_GRID_BOTS',
	SIMULATORS = 'SIMULATORS',
}

const productionNodeEnvs = ['prod', 'PROD', 'production'];
const devInitTypes = process.env.DEV_INIT_TYPES?.split(' ');

const devInitTypesCheck = (type: TYPE_ENV) => {
	if (!process.env.NODE_ENV) return false;
	if (productionNodeEnvs.includes(process.env.NODE_ENV)) return false;

	if (!process.env.DEV_INIT_TYPES) return false;
	if (process.env.NODE_ENV === 'development' && devInitTypes?.includes(type))
		return true;

	return false;
};

export const isInitTypeEnv = (type: TYPE_ENV, checkDev = true) => {
	if (checkDev && devInitTypesCheck(type)) return true;
	return process.env.TYPE_ENV === type;
};
