import { IProxy } from '@/domain/interfaces/proxy.interface';
import { IStartTradingBotQueueData } from '@/domain/interfaces/trading-bots/trading-bot-job.interface';
import { BotState } from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { ExchangeCredentialsService } from '@/infrastructure/exchanges/exchange-credentials/exchange-credentials.service';
import LoggerService from '@/infrastructure/services/logger/logger.service';
import TelegramService from '@/infrastructure/services/telegram/telegram.service';
import { TradingBotOrdersService } from '@/infrastructure/trading-bots/trading-bot-orders.service';
import { TradingBotService } from '@/infrastructure/trading-bots/trading-bots.service';
import { readProxies } from '@/infrastructure/utils/proxy.util';
import { calculatePositionsSummary } from '@/infrastructure/utils/trading-orders.util';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class TradingBotWorkerService {
	constructor(
		readonly logger: LoggerService,
		private readonly tradingBotService: TradingBotService,
		private readonly botOrdersService: TradingBotOrdersService,
		private readonly exchangeCredentialsService: ExchangeCredentialsService,
		private readonly telegramService: TelegramService,
	) {}

	async startBot(data: IStartTradingBotQueueData): Promise<any> {
		const { botId } = data;

		try {
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

			const runningBots = await this.tradingBotService.findBotsByUserId(
				userId,
				{ isActive: true },
			);
			let foundProxy: IProxy | undefined;

			const botsWithoutProxy = runningBots.filter(
				(bot) => !bot.proxyId && bot.id !== botId,
			);

			// if there are bots without proxy, we need to find one
			if (botsWithoutProxy.length) {
				const proxies = await readProxies();

				if (!proxies?.length) {
					throw new BadRequestException('Нет доступных прокси');
				}

				const usedProxyIds = runningBots.map((bot) => bot.proxyId);
				foundProxy = proxies.find(
					(proxy: IProxy) => !usedProxyIds.includes(proxy.id),
				);

				if (!foundProxy) {
					throw new BadRequestException('Все прокси используется');
				}

				await this.tradingBotService.update(botId, {
					proxyId: foundProxy.id,
				});
			}

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
						triggerPrice: botEntity.triggerPrice,
						tradeOnStart: botEntity.tradeOnStart,
						takeProfitOnPnl: botEntity.takeProfitOnPnl,
					},
					proxy: foundProxy,
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
							} else if (
								state === BotState.WaitingForTriggerPrice
							) {
								await this.tradingBotService.update(botId, {
									state: BotState.WaitingForTriggerPrice,
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

									setTimeout(() => {
										process.exit(5222);
									}, 5000);
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

								setTimeout(() => {
									process.exit(5223);
								}, 5000);
							}
						},

						getBotConfig: async () => {
							const bot =
								await this.tradingBotService.findBotById(
									botEntity.id,
								);

							return bot!;
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

							const orders =
								await this.botOrdersService.findByBotId(
									botEntity.id,
								);

							const { pnl, buyOrdersCount, sellOrdersCount } =
								calculatePositionsSummary(orders);

							const message = `BYBIT
					📈 **Информация об ордере**
					- Сторона: ${order.side}
					- Триггерная цена: ${order.triggerPrice}
					- Покупная цена: ${order.avgPrice}
					
					💰 **Доходность**
					- PnL: ${pnl.netPnl.toFixed(2)}
					- Нереализованная прибыль: ${pnl.unrealizedPnl.toFixed(2)}
					- Реализованная прибыль: ${pnl.realizedPnl.toFixed(2)}
					- Убыток: ${pnl.totalProfit.toFixed(2)}
					- Комиссия: ${pnl.fee.toFixed(2)}

					🔄 **Общее количество операций**
					- Покупки: ${buyOrdersCount}
					- Продажи: ${sellOrdersCount}`;

							await this.telegramService.sendMessage(
								userId,
								message,
							);
						},
					},
				})
				.catch(async (err) => {
					this.logger.error('Error while starting bot', err);
					await this.tradingBotService.update(botId, {
						state: BotState.Errored,
						stoppedAt: new Date(),
						stopReason: err.message || 'Ошибка при запуска',
					});

					setTimeout(() => {
						process.exit(5222);
					}, 5000);
				});
		} catch (err: any) {
			await this.tradingBotService.update(botId, {
				state: BotState.Errored,
				stoppedAt: new Date(),
				stopReason: err?.message || 'Неизвестная ошибка',
			});

			process.exit(5222);
		}
	}
}
