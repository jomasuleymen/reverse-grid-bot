import { IStartTradingBotQueueData } from '@/domain/interfaces/trading-bots/trading-bot-job.interface';
import { BotState } from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { ExchangeCredentialsService } from '@/infrastructure/exchanges/exchange-credentials/exchange-credentials.service';
import { QUEUES } from '@/infrastructure/services/bull/bull.const';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import TelegramService from '@/infrastructure/services/telegram/telegram.service';
import { TradingBotOrdersService } from '@/infrastructure/trading-bots/trading-bot-orders.service';
import { TradingBotService } from '@/infrastructure/trading-bots/trading-bots.service';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor(QUEUES.TRADING_BOT_START)
export class TradingBotStartConsumer extends WorkerHost {
	constructor(
		private readonly loggerService: LoggerService,
		private readonly tradingBotService: TradingBotService,
		private readonly botOrdersService: TradingBotOrdersService,
		private readonly exchangeCredentialsService: ExchangeCredentialsService,
		private readonly telegramService: TelegramService,
	) {
		super();
	}

	async process(job: Job<IStartTradingBotQueueData>): Promise<any> {
		const { botId } = job.data;

		const botEntity = await this.tradingBotService.findBotById(botId);
		if (!botEntity) {
			throw new BadRequestException('Бот не найден');
		}
		const credentials = await this.exchangeCredentialsService.findById(
			botEntity.credentialsId,
		);

		if (!credentials) {
			throw new BadRequestException('Реквизит аккаунта не найден');
		}

		const userId = botEntity.userId;
		const bot = await this.tradingBotService.getBotInstance(
			botEntity.exchange,
		);

		await bot
			.start({
				config: {
					baseCurrency: botEntity.baseCurrency,
					gridStep: botEntity.gridStep,
					gridVolume: botEntity.gridVolume,
					quoteCurrency: botEntity.quoteCurrency,
					takeProfitOnGrid: botEntity.takeProfitOnGrid,
					position: botEntity.position,
					takeProfit: botEntity.takeProfit,
				},
				credentials,
				callBacks: {
					onStateUpdate: async (state, data = {}) => {
						const { snapshots, stoppedReason } = data;
						const botState =
							await this.tradingBotService.getBotStatus(
								botEntity.id,
							);

						if (state === BotState.Running) {
							await this.telegramService.sendMessage(
								userId,
								this.tradingBotService.getSnapshotMessage(
									snapshots?.start!,
								),
							);

							await this.tradingBotService.update(botId, {
								state: BotState.Running,
							});
						} else if (state === BotState.Stopped) {
							if (
								botState !== BotState.Stopped &&
								botState !== BotState.Errored
							) {
								await this.tradingBotService.update(botId, {
									state: BotState.Stopped,
									stoppedAt: new Date(),
									stopReason: stoppedReason,
								});

								await this.telegramService.sendMessage(
									userId,
									`------ Открытие ------\n\n` +
										this.tradingBotService.getSnapshotMessage(
											snapshots?.start!,
										) +
										'\n\n' +
										`------ Закрытие ------\n\n` +
										this.tradingBotService.getSnapshotMessage(
											snapshots?.end!,
										),
								);
							}
						} else if (state === BotState.Initializing) {
							await this.tradingBotService.update(botId, {
								state: BotState.Initializing,
							});
						} else if (state === BotState.Stopping) {
							await this.tradingBotService.update(botId, {
								state: BotState.Stopping,
								stopReason: stoppedReason,
							});
						} else if (state === BotState.Errored) {
							await this.tradingBotService.update(botId, {
								state: BotState.Errored,
								stoppedAt: new Date(),
								stopReason:
									stoppedReason || 'Неизвестная ошибка',
							});
						}
					},

					checkBotState: async () => {
						return await this.tradingBotService.getBotStatus(
							botEntity.id,
						);
					},

					onNewOrder: async (order) => {
						await this.botOrdersService.save(botEntity.id, {
							orderId: order.id,
							avgPrice: order.avgPrice,
							customId: order.customId,
							fee: order.fee,
							feeCurrency: order.feeCurrency,
							quantity: order.quantity,
							side: order.side,
							symbol: order.symbol,
							createdDate: order.createdDate,
							triggerPrice: order.triggerPrice,
						});

						const summary =
							await this.tradingBotService.getBotSummary(
								botEntity.id,
							);

						const { buyCount, sellCount, pnl } = summary;

						const message = `BYBIT
					📈 **Информация об ордере**
					- Сторона: ${order.side}
					- Триггерная цена: ${order.triggerPrice}
					- Покупная цена: ${order.avgPrice}
					
					💰 **Доходность**
					- PnL: ${pnl.PnL.toFixed(2)}
					- Нереализованная прибыль: ${pnl.unrealizedPnL.toFixed(2)}
					- Реализованная прибыль: ${pnl.realizedPnL.toFixed(2)}
					- Убыток: ${pnl.totalProfit.toFixed(2)}
					- Комиссия: ${pnl.fee.toFixed(2)}

					🔄 **Общее количество операций**
					- Покупки: ${buyCount}
					- Продажи: ${sellCount}`;

						await this.telegramService.sendMessage(userId, message);
					},
				},
			})
			.catch(async (err) => {
				this.loggerService.error('Error while starting bot', err);
				await this.tradingBotService.update(botId, {
					state: BotState.Errored,
					stoppedAt: new Date(),
					stopReason: err.message || 'Ошибка при запуска',
				});
			});

		return {};
	}

	@OnWorkerEvent('error')
	async error(failedReason: unknown) {
		this.loggerService.error('Failed starting trading bot', failedReason);
	}
}
