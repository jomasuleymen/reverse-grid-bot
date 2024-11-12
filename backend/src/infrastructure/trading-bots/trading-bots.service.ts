import {
	ExchangeEnum,
	OrderSide,
} from '@/domain/interfaces/exchanges/common.interface';
import {
	IStartTradingBotQueueData,
	IStopTradingBotQueueData,
} from '@/domain/interfaces/trading-bots/trading-bot-job.interface';
import {
	BotState,
	ITradingBot,
	TradingBotSnapshot,
} from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Equal, FindOptionsWhere, In, Or, Repository } from 'typeorm';
import { ExchangeCredentialsService } from '../exchanges/exchange-credentials/exchange-credentials.service';
import { QUEUES } from '../services/bull/bull.const';
import { calculateOrdersPnL } from '../utils/trading-orders.util';
import { BinanceSpotReverseGridBot } from './bots/binance/spot-reverse-grid-bot';
import { BybitSpotReverseGridBot } from './bots/bybit/spot-reverse-grid-bot';
import { GetTradingBotsDto } from './dto/get-bots.dto';
import { StartBotDto } from './dto/start-bot.dto';
import { TradingBotEntity } from './entities/trading-bots.entity';
import { TradingBotOrdersService } from './trading-bot-orders.service';

@Injectable()
export class TradingBotService {
	constructor(
		private moduleRef: ModuleRef,
		@InjectRepository(TradingBotEntity)
		private readonly tradingBotRepo: Repository<TradingBotEntity>,
		private readonly exchangeCredentialsService: ExchangeCredentialsService,
		private readonly tradingBotOrdersService: TradingBotOrdersService,
		@InjectQueue(QUEUES.TRADING_BOT_START)
		private tradingBotStartQueue: Queue<IStartTradingBotQueueData>,
		@InjectQueue(QUEUES.TRADING_BOT_STOP)
		private tradingBotStopQueue: Queue<IStopTradingBotQueueData>,
	) {}

	async startBot(userId: number, options: StartBotDto): Promise<void> {
		const credentials = await this.getCredentials(
			userId,
			options.credentialsId,
		);

		const activeBot = await this.tradingBotRepo.findOneBy({
			userId,
			state: In([
				BotState.Running,
				BotState.Idle,
				BotState.Initializing,
				BotState.Stopping,
			]),
		});

		if (activeBot) throw new BadRequestException('У вас есть активный бот');

		const botEntity = await this.save({
			userId: userId,
			credentialsId: credentials.id,
			exchange: credentials.exchange,
			type: credentials.type,
			gridStep: options.gridStep,
			gridVolume: options.gridVolume,
			takeProfitOnGrid: options.takeProfitOnGrid,
			baseCurrency: options.baseCurrency,
			quoteCurrency: options.quoteCurrency,
			position: options.position,
		});

		await this.tradingBotStartQueue.add('start', {
			botId: botEntity.id,
		});
	}

	async stopBot(userId: number, botId: number): Promise<void> {
		await this.tradingBotStopQueue.add('stop', {
			botId,
		});
	}

	private async getCredentials(userId: number, credentialsId: number) {
		const credentials =
			await this.exchangeCredentialsService.findById(credentialsId);

		if (!credentials || credentials.userId !== userId) {
			throw new BadRequestException('Реквизиты бирж не ваша');
		}
		return credentials;
	}

	public async save(data: Partial<TradingBotEntity>) {
		return await this.tradingBotRepo.save(data);
	}

	public async findBotsByUserId(userId: number, payload?: GetTradingBotsDto) {
		const where: FindOptionsWhere<TradingBotEntity> = {
			userId: Equal(userId),
			state:
				payload?.isActive === undefined
					? undefined
					: payload.isActive
						? Or(
								Equal(BotState.Idle),
								Equal(BotState.Initializing),
								Equal(BotState.Running),
								Equal(BotState.Stopping),
							)
						: Or(Equal(BotState.Stopped), Equal(BotState.Errored)),
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
		
		const orders = await this.tradingBotOrdersService.findByBotId(botId);

		const pnl = calculateOrdersPnL(orders);
		const buyCount = orders.filter(
			(order) => order.side === OrderSide.BUY,
		).length;

		return {
			pnl,
			buyCount,
			sellCount: orders.length - buyCount,
		};
	}

	public async update(botId: number, data: Partial<TradingBotEntity>) {
		return await this.tradingBotRepo.update(botId, data);
	}

	public async getBotStatus(botId: number) {
		const bot = await this.findBotById(botId);
		if (!bot) throw new Error('Бот не найден');

		return bot.state;
	}

	public getSnapshotMessage(snapshot: TradingBotSnapshot): string {
		if (!snapshot?.walletBalance) return 'Нету данные';

		const coinsBalances = snapshot.walletBalance.coins
			.map(
				(c) =>
					`----- ${c.coin} -----\n` +
					`Баланс: ${c.balance.toFixed(6)} ${c.coin}\n`,
			)
			.join('\n');

		return (
			`Счёт: ${snapshot.walletBalance.accountType}\n` +
			`\n${coinsBalances}\n` +
			`Время: ${snapshot.datetime.toLocaleString('ru-RU', {
				timeZone: 'Asia/Almaty',
			})}`
		);
	}

	public async getBotInstance(exchange: ExchangeEnum): Promise<ITradingBot> {
		switch (exchange) {
			case ExchangeEnum.Bybit:
				return await this.moduleRef.resolve(BybitSpotReverseGridBot);
			case ExchangeEnum.Binance:
				return await this.moduleRef.resolve(BinanceSpotReverseGridBot);
			default:
				throw new Error('Биржа не поддерживается');
		}
	}
}
