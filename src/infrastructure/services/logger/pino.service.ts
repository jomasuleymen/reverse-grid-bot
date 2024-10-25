import fs from 'fs';
import path from 'path';
import pino from 'pino';

const logDir = path.resolve('logs');

if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir);
}

const transports = pino.transport({
	targets: [
		{
			level: 'info',
			target: 'pino/file',
			options: { destination: path.join(logDir, 'info.log') },
		},
		{
			level: 'warn',
			target: 'pino/file',
			options: { destination: path.join(logDir, 'warn.log') },
		},
		{
			level: 'error',
			target: 'pino/file',
			options: { destination: path.join(logDir, 'error.log') },
		},
		{
			level: 'fatal',
			target: 'pino/file',
			options: { destination: path.join(logDir, 'fatal.log') },
		},
	],
});

const pinoLogger = pino(
	{
		formatters: {
			bindings: (obj) => {
				return {};
			},
		},
		nestedKey: 'content',
		timestamp: pino.stdTimeFunctions.isoTime,
	},
	transports,
);

pinoLogger.useLevelLabels = true;

export default pinoLogger;
