import path from 'path';
import pino from 'pino';

const logDir = path.resolve('logs');

const transports = pino.transport({
	targets: [
		{
			level: 'info',
			target: 'pino-pretty',
			options: { destination: path.join(logDir, 'info.log') },
		},
		{
			level: 'warn',
			target: 'pino-pretty',
			options: { destination: path.join(logDir, 'warn.log') },
		},
		{
			level: 'error',
			target: 'pino-pretty',
			options: { destination: path.join(logDir, 'error.log') },
		},
		{
			level: 'fatal',
			target: 'pino-pretty',
			options: { destination: path.join(logDir, 'fatal.log') },
		},
	],
});

const logger = pino(
	{
		formatters: {
			bindings: (obj) => {
				return {};
			},
		},
	},
	transports,
);

logger.info({ asdf: 'SADF' }, 'MESSAGEE');

export default logger;
