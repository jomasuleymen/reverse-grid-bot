import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import {
	ExchangeCredentialsType,
	IExchangeCredentials,
} from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import { TradingBotConfigEntity } from '@/infrastructure/entities/trading/trading-config.entity';
import { BotConfigRepository } from '@/infrastructure/repositories/trading/trading-config.repo';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { BybitSpotReverseGridBot } from '@/infrastructure/modules/trading-bots/bybit/spot-reverse-grid-bot';
import { TradingbotUserError } from '@/infrastructure/modules/trading-bots/common/errors';
import { TradingBotsService } from '@/infrastructure/modules/trading-bots/trading-bots.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validate } from 'class-validator';

interface StartSpotReverserBotOptions {
	userId: number;
	exchange: ExchangeEnum;
}

@Injectable()
export class TradingBotsApplicationService {
	private readonly bots: Record<number, BybitSpotReverseGridBot> = {};

	constructor(
		private readonly botConfigRepo: BotConfigRepository,
		private readonly configService: ConfigService,
		private readonly tradingBotService: TradingBotsService,
		private readonly loggerService: LoggerService,
	) {}

	private async validateConfigOrFail(
		botConfig: TradingBotConfigEntity,
	): Promise<void> {
		const errors = await validate(botConfig);
		if (errors.length > 0) {
			const messages = errors
				.map((err) => Object.values(err.constraints || {}))
				.flat()
				.map(
					(constraintMsg, index) => `${index + 1}. ${constraintMsg}`,
				);
			throw new BadRequestException(
				`Ошибки в настройках:\n${messages.join('\n')}`,
			);
		}
	}

	async startReverseBot(
		options: StartSpotReverserBotOptions,
		callback: (msg: string) => void,
	): Promise<void> {
		const botConfig = await this.botConfigRepo.findByUserId(options.userId);
		if (!botConfig) {
			throw new BadRequestException('Настройте бота перед запуском.');
		}

		await this.validateConfigOrFail(botConfig);

		if (this.bots[options.userId]) {
			throw new Error('У вас уже есть запущенный бот.');
		}

		const bot = await this.tradingBotService.getBot(ExchangeEnum.Bybit);
		const credentials: IExchangeCredentials = {
			apiKey: this.configService.getOrThrow('bybit.api.key'),
			apiSecret: this.configService.getOrThrow('bybit.api.secret'),
			exchange: ExchangeEnum.Bybit,
			type: ExchangeCredentialsType.Testnet,
		};

		this.bots[options.userId] = bot;

		try {
			await bot.start(botConfig, credentials, { id: options.userId });
			callback('Бот успешно запущен.');
		} catch (err) {
			delete this.bots[options.userId];
			this.loggerService.error('Ошибка при запуске бота:', err);
			if (err instanceof TradingbotUserError) {
				callback(err.message);
			} else {
				callback('Произошла ошибка при запуске бота.');
			}
		}
	}

	async stopReverseBot(
		options: StartSpotReverserBotOptions,
		callback: (msg: string) => void,
	): Promise<void> {
		const bot = this.bots[options.userId];
		if (!bot) {
			throw new BadRequestException(
				'Не найден активный бот для остановки.',
			);
		}

		delete this.bots[options.userId];

		try {
			await bot.stop();
			callback('Бот успешно остановлен.');
		} catch (err) {
			this.loggerService.error('Ошибка при остановке бота:', err);
			callback('Произошла ошибка при остановке бота.');
		}
	}
}
