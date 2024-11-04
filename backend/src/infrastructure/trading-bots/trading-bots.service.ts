import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import { ITradingBot } from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ExchangeCredentialsService } from '../exchanges/exchange-credentials/exchange-credentials.service';
import { BybitSpotReverseGridBot } from './bots/bybit/spot-reverse-grid-bot';
import { TradingBotConfigsService } from './configurations/trading-configs.service';

interface StartSpotReverserBotOptions {
	credentialsId: number;
	configId: number;
}

@Injectable()
export class TradingBotService {
	private readonly bots: Record<number, ITradingBot> = {};

	constructor(
		private readonly botConfigsService: TradingBotConfigsService,
		private readonly exchangeCredentialsService: ExchangeCredentialsService,
		private readonly loggerService: LoggerService,
		private moduleRef: ModuleRef,
	) {}

	async startReverseBot(
		userId: number,
		options: StartSpotReverserBotOptions,
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
		} catch (err) {
			delete this.bots[userId];
			this.loggerService.error('Ошибка при запуске бота:', err);
		}
	}

	async stopReverseBot(userId: number): Promise<void> {
		const bot = this.bots[userId];
		if (!bot) {
			throw new BadRequestException(
				'Не найден активный бот для остановки.',
			);
		}

		delete this.bots[userId];

		try {
			await bot.stop();
		} catch (err) {
			this.loggerService.error('Ошибка при остановке бота:', err);
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
