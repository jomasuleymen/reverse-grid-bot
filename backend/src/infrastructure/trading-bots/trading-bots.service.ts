import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { BybitSpotReverseGridBot } from '@/infrastructure/trading-bots/bybit/spot-reverse-grid-bot';
import { TradingbotUserError } from '@/infrastructure/trading-bots/common/errors';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ExchangeCredentialsService } from './exchange-credentials.service';
import { TradingBotConfigsService } from './trading-bot-configs.service';

interface StartSpotReverserBotOptions {
	credentialsId: number;
	configId: number;
}

@Injectable()
export class TradingBotService {
	private readonly bots: Record<number, BybitSpotReverseGridBot> = {};

	constructor(
		private readonly botConfigsService: TradingBotConfigsService,
		private readonly exchangeCredentialsService: ExchangeCredentialsService,
		private readonly loggerService: LoggerService,
		private moduleRef: ModuleRef,
	) {}

	async startReverseBot(
		userId: number,
		options: StartSpotReverserBotOptions,
		callback: (msg: string) => void,
	): Promise<void> {
		if (this.bots[userId]) {
			throw new BadRequestException('У вас уже есть запущенный бот.');
		}

		const botConfig = await this.botConfigsService.findById(
			options.configId,
		);

		if (!botConfig) {
			throw new BadRequestException('Настройка бота не найдена');
		}

		if (botConfig?.userId !== userId) {
			throw new BadRequestException('Настройка бота не ваша');
		}

		const bot = await this.getBot(ExchangeEnum.Bybit);
		const credentials = await this.exchangeCredentialsService.findById(
			options.credentialsId,
		);
		if (!credentials) {
			throw new BadRequestException('Реквизиты для входа не найдены');
		}

		this.bots[userId] = bot;

		try {
			await bot.start(botConfig, credentials, { id: userId });
			callback('Бот успешно запущен.');
		} catch (err) {
			delete this.bots[userId];
			this.loggerService.error('Ошибка при запуске бота:', err);
			if (err instanceof TradingbotUserError) {
				callback(err.message);
			} else {
				callback('Произошла ошибка при запуске бота.');
			}
		}
	}

	async stopReverseBot(
		userId: number,
		callback: (msg: string) => void,
	): Promise<void> {
		const bot = this.bots[userId];
		if (!bot) {
			throw new BadRequestException(
				'Не найден активный бот для остановки.',
			);
		}

		delete this.bots[userId];

		try {
			await bot.stop();
			callback('Бот успешно остановлен.');
		} catch (err) {
			this.loggerService.error('Ошибка при остановке бота:', err);
			callback('Произошла ошибка при остановке бота.');
		}
	}

	public async getBot(exchange: ExchangeEnum) {
		switch (exchange) {
			case ExchangeEnum.Bybit:
				return await this.moduleRef.resolve(BybitSpotReverseGridBot);
		}

		throw new Error('Биржа не поддерживается');
	}
}
