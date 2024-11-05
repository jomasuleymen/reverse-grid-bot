import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import {
	BotState,
	ITradingBot,
} from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOptionsWhere, Not, Repository } from 'typeorm';
import { ExchangeCredentialsService } from '../exchanges/exchange-credentials/exchange-credentials.service';
import { BybitSpotReverseGridBot } from './bots/bybit/spot-reverse-grid-bot';
import { GetTradingBotsDto } from './dto/get-bots.dto';
import { StartBotDto } from './dto/start-bot.dto';
import { TradingBotEntity } from './entities/trading-bots.entity';

@Injectable()
export class TradingBotService {
	private readonly bots: Record<number, ITradingBot> = {};

	constructor(
		@InjectRepository(TradingBotEntity)
		private readonly tradingBotRepo: Repository<TradingBotEntity>,
		private readonly exchangeCredentialsService: ExchangeCredentialsService,
		private readonly loggerService: LoggerService,
		private moduleRef: ModuleRef,
	) {}

	async startBot(userId: number, options: StartBotDto): Promise<void> {
		const credentials = await this.exchangeCredentialsService.findById(
			options.credentialsId,
		);

		if (credentials?.userId !== userId) {
			throw new BadRequestException('Реквизиты бирж не ваша');
		}

		if (!credentials) {
			throw new BadRequestException('Реквизиты для входа не найдены');
		}

		const botEntity = await this.tradingBotRepo.save({
			userId,
			credentialsId: credentials.id,
			exchange: credentials.exchange,
			type: credentials.type,
			gridStep: options.gridStep,
			gridVolume: options.gridVolume,
			takeProfit: options.takeProfit,
			baseCurrency: options.baseCurrency,
			quoteCurrency: options.quoteCurrency,
		});

		const bot = await this.getBot(botEntity.exchange);

		try {
			await bot.start({
				config: {
					...options,
					symbol: options.baseCurrency + options.quoteCurrency,
				},
				credentials,
				userId,
				onStateUpdate: async (state: BotState) => {
					await this.updateBot(botEntity.id, { state });
				},
			});
			this.bots[botEntity.id] = bot;
		} catch (err) {
			await bot.stop();
			await this.updateBot(botEntity.id, { stoppedAt: new Date() });
			this.loggerService.error('Ошибка при запуске бота:', err);
			throw new BadRequestException('Ошибка при запуске бота');
		}
	}

	async stopBot(userId: number, botId: number): Promise<void> {
		const bot = this.bots[botId];
		if (!bot) {
			throw new BadRequestException(
				'Не найден активный бот для остановки.',
			);
		}

		try {
			await bot.stop();
			await this.updateBot(botId, { stoppedAt: new Date() });
			delete this.bots[botId];
			await this.tradingBotRepo.update(botId, {
				state: BotState.Stopped,
			});
		} catch (err) {
			this.loggerService.error('Ошибка при остановке бота:', err);
			throw new BadRequestException('Ошибка при остановке бота');
		}
	}

	private async getBot(exchange: ExchangeEnum) {
		switch (exchange) {
			case ExchangeEnum.Bybit:
				return await this.moduleRef.resolve(BybitSpotReverseGridBot);
		}

		throw new Error('Биржа не поддерживается');
	}

	public async findBotsByUserId(userId: number, payload?: GetTradingBotsDto) {
		const where: FindOptionsWhere<TradingBotEntity> = {
			userId: Equal(userId),
		};

		if (payload) {
			if (payload.isActive === true) {
				where.state = Not(Equal(BotState.Stopped));
			} else if (payload.isActive === false) {
				where.state = Equal(BotState.Stopped);
			}
		}

		return await this.tradingBotRepo.find({ where, order: { id: 'DESC' } });
	}

	public async updateBot(botId: number, payload: Partial<TradingBotEntity>) {
		return await this.tradingBotRepo.update(botId, payload);
	}
}
