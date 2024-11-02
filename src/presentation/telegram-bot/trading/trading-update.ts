import { TradingBotsApplicationService } from '@/application/services/trading-bots.service';
import { MyContext, WIZARDS } from '@/domain/adapters/telegram.interface';
import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import { BotConfigRepository } from '@/infrastructure/repositories/trading/trading-config.repo';
import TelegramService from '@/infrastructure/services/telegram/telegram.service';
import { Action, Command, Ctx, Start, Update } from 'nestjs-telegraf';
import { BOT_COMMANDS, CALLBACK_ACTIONS } from '../common/constants';
import { TradingUpdateBase } from './common';

@Update()
export class TradingTelegramUpdate extends TradingUpdateBase {
	constructor(
		private readonly botConfigRepo: BotConfigRepository,
		private readonly telegramService: TelegramService,
		private readonly tradingBotService: TradingBotsApplicationService,
	) {
		super();
		this.telegramService.addMyCommands([
			{ command: BOT_COMMANDS.START, description: 'Старт бота' },
			{ command: BOT_COMMANDS.STOP, description: 'Остановить бота' },
			{
				command: BOT_COMMANDS.EDIT_CONFIG,
				description: 'Настроить бота',
			},
		]);
	}

	@Start()
	async handleStartCommand(@Ctx() ctx: MyContext) {
		const config = await this.botConfigRepo.findByUserId(ctx.user.id);
		const text = config
			? `Проверяйте данные на корректность!\n\n${this.formatConfigText(config)}`
			: 'Перед старторм нужно конфигурироввать через команду, /editconfig';

		await ctx.reply(text, {
			reply_markup: config
				? {
						inline_keyboard: [
							[
								{
									text: 'Изменить настройку',
									callback_data: BOT_COMMANDS.EDIT_CONFIG,
								},
							],
							[
								{
									text: 'Начать',
									callback_data:
										CALLBACK_ACTIONS.CONFIRM_START,
								},
								{
									text: 'Отмена',
									callback_data:
										CALLBACK_ACTIONS.CANCEL_START,
								},
							],
						],
					}
				: undefined,
		});
	}

	@Command(BOT_COMMANDS.STOP)
	async handleStopCommand(@Ctx() ctx: MyContext) {
		this.tradingBotService
			.stopReverseBot(
				{
					userId: ctx.user.id,
					exchange: ExchangeEnum.Bybit,
				},
				async (msg) => {
					await ctx.reply(msg).catch((err) => {
						console.log(err.message);
					});
				},
			)
			.catch(async (err) => {
				await ctx.reply(err.message);
			});
	}

	@Command(BOT_COMMANDS.EDIT_CONFIG)
	async handleEditConfigCommand(@Ctx() ctx: MyContext) {
		await ctx.scene.enter(WIZARDS.TRADING_EDIT_CONFIG);
	}

	@Action(BOT_COMMANDS.EDIT_CONFIG)
	async handleEditConfigAction(@Ctx() ctx: MyContext) {
		await ctx.editMessageReplyMarkup(undefined);
		await ctx.answerCbQuery();
		await ctx.scene.enter(WIZARDS.TRADING_EDIT_CONFIG);
	}

	@Action([CALLBACK_ACTIONS.CONFIRM_START, CALLBACK_ACTIONS.CANCEL_START])
	async handleStartConfirmation(@Ctx() ctx: MyContext) {
		const action = (ctx.callbackQuery as any).data;

		await ctx.answerCbQuery();
		await ctx.editMessageReplyMarkup(undefined);

		if (action === CALLBACK_ACTIONS.CONFIRM_START) {
			this.tradingBotService
				.startReverseBot(
					{
						userId: ctx.user.id,
						exchange: ExchangeEnum.Bybit,
					},
					async (msg) => {
						await ctx.reply(msg).catch((err) => {
							console.log(err.message);
						});
					},
				)
				.catch(async (err) => {
					await ctx.reply(err.message);
				});
		} else {
			await ctx.reply('Операция отменена');
		}
	}
}
