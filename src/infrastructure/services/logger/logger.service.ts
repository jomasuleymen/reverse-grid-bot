import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import path from 'path';
import pino, { DestinationStream, Logger } from 'pino';

@Injectable()
class LoggerService {
	private readonly pinoLogger: Logger;

	constructor(private readonly configService: ConfigService) {
		const loggerType = this.configService.getOrThrow('logger.type');
		this.pinoLogger = this.getPinoLogger(loggerType);
	}

	debug(message: string, obj?: object) {
		this.pinoLogger.debug(obj, message);
	}
	info(message: string, obj?: object) {
		this.pinoLogger.info(obj, message);
	}
	warn(message: string, obj?: object) {
		this.pinoLogger.warn(obj, message);
	}
	error(message: string, obj?: object) {
		this.pinoLogger.error(obj, message);
	}
	fatal(message: string, obj?: object) {
		this.pinoLogger.fatal(obj, message);
	}

	private getPinoLogger(transportType: 'local' | 'axiom') {
		let transport: DestinationStream;

		if (transportType === 'local') transport = this.getFileTransport();
		else if (transportType === 'axiom') {
			const token = this.configService.getOrThrow('logger.axiom.token');
			const dataSet = this.configService.getOrThrow(
				'logger.axiom.dataset',
			);

			transport = this.getAxiomTransport(token, dataSet);
		} else {
			throw new Error("Logger type should be either 'local' or 'axiom'");
		}

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
			transport,
		);

		pinoLogger.useLevelLabels = true;

		return pinoLogger;
	}

	private getFileTransport() {
		const logDir = path.resolve('logs');

		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir);
		}

		const levels: pino.Level[] = [
			'info',
			'trace',
			'warn',
			'debug',
			'error',
			'fatal',
		];

		return pino.transport({
			targets: levels.map((level) => ({
				level,
				target: 'pino-pretty',
				options: {
					destination: path.join(logDir, `${level}.log`),
					colorize: true,
					sync: false,
				},
			})),
		});
	}

	private getAxiomTransport(token: string, dataset: string) {
		return pino.transport({
			target: '@axiomhq/pino',
			options: {
				token: token,
				dataset: dataset,
				sync: false,
			},
		});
	}
}

export default LoggerService;
