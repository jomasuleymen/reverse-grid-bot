import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import path from 'path';
import pino, { DestinationStream, Level, Logger } from 'pino';

@Injectable()
class LoggerService {
	private readonly pinoLogger: Logger;

	constructor(private readonly configService: ConfigService) {
		this.pinoLogger = this.createLogger();
	}

	debug(message: string, obj?: object) {
		this.log('debug', message, obj);
	}
	info(message: string, obj?: object) {
		this.log('info', message, obj);
	}
	warn(message: string, obj?: object) {
		this.log('warn', message, obj);
	}
	error(message: string, obj?: object) {
		this.log('error', message, obj);
	}
	fatal(message: string, obj?: object) {
		this.log('fatal', message, obj);
	}

	private log(level: Level, message: string, obj?: object) {
		this.pinoLogger[level](obj, message);
	}

	private createLogger(): Logger {
		const loggerType = this.configService.getOrThrow('logger.type');
		const transport = this.getTransport(loggerType);

		const pinoLogger = pino(
			{
				formatters: { bindings: () => ({}) },
				nestedKey: 'content',
				errorKey: 'error',
				timestamp: pino.stdTimeFunctions.isoTime,
			},
			transport,
		);

		pinoLogger.useLevelLabels = true;
		return pinoLogger;
	}

	private getTransport(type: 'local' | 'axiom'): DestinationStream {
		switch (type) {
			case 'local':
				return this.createFileTransport();
			case 'axiom':
				return this.createAxiomTransport();
			default:
				throw new Error(
					"Logger type should be either 'local' or 'axiom'",
				);
		}
	}

	private createFileTransport(): DestinationStream {
		const logDir = path.resolve('logs');
		if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

		const levels: Level[] = [
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

	private createAxiomTransport(): DestinationStream {
		const token =
			this.configService.getOrThrow<string>('logger.axiom.token');
		const dataset = this.configService.getOrThrow<string>(
			'logger.axiom.dataset',
		);

		return pino.transport({
			target: '@axiomhq/pino',
			options: {
				token,
				dataset,
				sync: false,
			},
		});
	}
}

export default LoggerService;
