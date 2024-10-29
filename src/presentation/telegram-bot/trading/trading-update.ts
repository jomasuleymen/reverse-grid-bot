import { MyContext, WIZARDS } from '@/domain/adapters/telegram.interface';
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
	) {
		super();
		this.telegramService.addMyCommands([
			{ command: BOT_COMMANDS.START, description: 'Старт бота' },
			{ command: BOT_COMMANDS.STOP, description: 'Stop the bot' },
			{
				command: BOT_COMMANDS.EDIT_CONFIG,
				description: 'Edit bot config',
			},
		]);
	}

	@Start()
	async handleStartCommand(@Ctx() ctx: MyContext) {
		const config = await this.botConfigRepo.findByUserId(ctx.user.id);
		const text = config
			? `${this.formatConfigText(config)}\nThe configuration correct?`
			: 'Перед старторм нужно конфигурироввать через команду, /editconfig';

		await ctx.reply(text, {
			reply_markup: config
				? {
						inline_keyboard: [
							[
								{
									text: 'Edit',
									callback_data: BOT_COMMANDS.EDIT_CONFIG,
								},
							],
							[
								{
									text: 'Start',
									callback_data:
										CALLBACK_ACTIONS.CONFIRM_START,
								},
								{
									text: 'Закрыть',
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
		await ctx.reply('Stop button clicked');
	}

	@Command(BOT_COMMANDS.EDIT_CONFIG)
	async handleEditConfigCommand(@Ctx() ctx: MyContext) {
		await ctx.scene.enter(WIZARDS.TRADING_EDIT_CONFIG);
	}

	@Action(BOT_COMMANDS.EDIT_CONFIG)
	async handleEditConfigAction(@Ctx() ctx: MyContext) {
		await ctx.answerCbQuery();
		await ctx.scene.enter(WIZARDS.TRADING_EDIT_CONFIG);
	}

	@Action([CALLBACK_ACTIONS.CONFIRM_START, CALLBACK_ACTIONS.CANCEL_START])
	async handleStartConfirmation(@Ctx() ctx: MyContext) {
		const action = (ctx.callbackQuery as any).data;
		const responseText =
			action === CALLBACK_ACTIONS.CONFIRM_START
				? 'Configuration confirmed. Bot is starting.'
				: 'Configuration cancelled.';

		await ctx.editMessageText(responseText);
		await ctx.answerCbQuery();
	}
}
