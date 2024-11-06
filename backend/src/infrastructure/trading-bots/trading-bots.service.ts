import {
	ExchangeEnum,
	OrderSide,
} from '@/domain/interfaces/exchanges/common.interface';
import {
	BotState,
	IExchangeCredentials,
	ITradingBot,
} from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOptionsWhere, Not, Repository } from 'typeorm';
import { ExchangeCredentialsService } from '../exchanges/exchange-credentials/exchange-credentials.service';
import { BybitService } from '../exchanges/modules/bybit/bybit.service';
import { calculateOrdersPnL } from '../utils/trading-orders.util';
import { BybitSpotReverseGridBot } from './bots/bybit/spot-reverse-grid-bot';
import { GetTradingBotsDto } from './dto/get-bots.dto';
import { StartBotDto } from './dto/start-bot.dto';
import { TradingBotEntity } from './entities/trading-bots.entity';
import { TradingBotOrdersService } from './trading-bot-orders.service';

@Injectable()
export class TradingBotService {
	private readonly bots: Record<number, ITradingBot> = {};

	constructor(
		@InjectRepository(TradingBotEntity)
		private readonly tradingBotRepo: Repository<TradingBotEntity>,
		private readonly exchangeCredentialsService: ExchangeCredentialsService,
		private readonly tradingBotOrdersService: TradingBotOrdersService,
		private readonly loggerService: LoggerService,
		private readonly bybitService: BybitService,
		private moduleRef: ModuleRef,
	) {}

	async startBot(userId: number, options: StartBotDto): Promise<void> {
		const credentials = await this.getCredentials(
			userId,
			options.credentialsId,
		);
		const botEntity = await this.createBotEntity(
			userId,
			credentials,
			options,
		);
		const bot = await this.getBotInstance(botEntity.exchange);

		await this.startBotInstance(bot, botEntity, credentials, options);
	}

	async stopBot(userId: number, botId: number): Promise<void> {
		const bot = this.bots[botId];
		if (!bot) {
			await this.updateBotState(botId, BotState.Stopped);
			return;
		}

		await this.stopBotInstance(bot, botId);
	}

	// Helper Methods
	private async getCredentials(userId: number, credentialsId: number) {
		const credentials =
			await this.exchangeCredentialsService.findById(credentialsId);

		if (!credentials || credentials.userId !== userId) {
			throw new BadRequestException('Реквизиты бирж не ваша');
		}
		return credentials;
	}

	private async createBotEntity(
		userId: number,
		credentials: IExchangeCredentials,
		options: StartBotDto,
	) {
		return this.tradingBotRepo.save({
			userId,
			credentialsId: credentials.id,
			exchange: credentials.exchange,
			type: credentials.type,
			gridStep: options.gridStep,
			gridVolume: options.gridVolume,
			takeProfitOnGrid: options.takeProfitOnGrid,
			baseCurrency: options.baseCurrency,
			quoteCurrency: options.quoteCurrency,
			symbol: `${options.baseCurrency}${options.quoteCurrency}`,
		});
	}

	private async getBotInstance(exchange: ExchangeEnum): Promise<ITradingBot> {
		switch (exchange) {
			case ExchangeEnum.Bybit:
				return await this.moduleRef.resolve(BybitSpotReverseGridBot);
			default:
				throw new Error('Биржа не поддерживается');
		}
	}

	private async startBotInstance(
		bot: ITradingBot,
		botEntity: TradingBotEntity,
		credentials: IExchangeCredentials,
		options: StartBotDto,
	) {
		try {
			await bot.start({
				config: {
					...options,
					symbol: `${options.baseCurrency}${options.quoteCurrency}`,
				},
				credentials,
				userId: botEntity.userId,
				botId: botEntity.id,
				onStateUpdate: async (state: BotState) =>
					await this.updateBotState(botEntity.id, state),
			});
			this.bots[botEntity.id] = bot;
		} catch (err) {
			this.handleError('Ошибка при запуске бота:', err, botEntity.id);
			await bot.stop();
		}
	}

	private async stopBotInstance(bot: ITradingBot, botId: number) {
		try {
			await bot.stop();
		} catch (err) {
			this.loggerService.error('Ошибка при остановке бота:', err);
			throw new BadRequestException('Ошибка при остановке бота');
		} finally {
			delete this.bots[botId];
			await this.updateBotState(botId, BotState.Stopped);
		}
	}

	private async updateBotState(botId: number, state: BotState) {
		if (state === BotState.Stopped && this.bots[botId])
			delete this.bots[botId];

		await this.tradingBotRepo.update(botId, {
			state,
			stoppedAt: state === BotState.Stopped ? new Date() : undefined,
		});
	}

	private handleError(message: string, error: any, botId?: number) {
		this.loggerService.error(message, error);
		if (botId) this.updateBotState(botId, BotState.Stopped);
		throw new BadRequestException(error.message || message);
	}

	public async findBotsByUserId(userId: number, payload?: GetTradingBotsDto) {
		const where: FindOptionsWhere<TradingBotEntity> = {
			userId: Equal(userId),
			state:
				payload?.isActive === undefined
					? undefined
					: payload.isActive
						? Not(Equal(BotState.Stopped))
						: Equal(BotState.Stopped),
		};

		return this.tradingBotRepo.find({ where, order: { id: 'DESC' } });
	}

	public async findBotById(id: number) {
		const where: FindOptionsWhere<TradingBotEntity> = {
			id: Equal(id),
		};

		return this.tradingBotRepo.findOne({ where });
	}

	public async getBotSummary(botId: number) {
		const bot = await this.tradingBotRepo.findOne({
			where: { id: Equal(botId) },
		});

		if (!bot) throw new BadRequestException('Бот не найден');

		// const [orders, latestPrice] = await Promise.all([
		// 	await this.tradingBotOrdersService.findByBotId(botId),
		// 	await this.bybitService.getTickerLastPrice(
		// 		'spot',
		// 		bot.baseCurrency + bot.quoteCurrency,
		// 	),
		// ]);

		const orders = await this.tradingBotOrdersService.findByBotId(botId);

		const pnl = calculateOrdersPnL(orders, orders[0]?.avgPrice);
		const buyCount = orders.filter(
			(order) => order.side === OrderSide.BUY,
		).length;

		return {
			pnl,
			buyCount,
			sellCount: orders.length - buyCount,
			sumComission: orders.reduce((prev, curr) => prev + curr.fee, 0),
		};
	}
}
