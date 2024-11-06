import { MyContext } from '@/domain/adapters/telegram.interface';
import { TelegramPreferencesService } from '@/infrastructure/notification/telegram-preferences.service';
import TelegramService from '@/infrastructure/services/telegram/telegram.service';
import { TradingBotConfigsService } from '@/infrastructure/trading-bots/configurations/trading-configs.service';
import { TradingBotService } from '@/infrastructure/trading-bots/trading-bots.service';
import { UserService } from '@/infrastructure/user/user.service';
import { Action, Command, Ctx, On, Start, Update } from 'nestjs-telegraf';
import LoggerService from '../../logger/logger.service';
import { CALLBACK_ACTIONS, TradingUpdateBase } from './common';

const BOT_COMMANDS = {
	START: 'start',
	STOP: 'stop',
	CONNECT: 'connect',
};
@Update()
export class TradingBotUpdate extends TradingUpdateBase {
	constructor(
		private readonly botConfigService: TradingBotConfigsService,
		private readonly telegramService: TelegramService,
		private readonly userService: UserService,
		private readonly telegramPreferencesService: TelegramPreferencesService,
		private readonly tradingBotService: TradingBotService,
		private readonly loggerService: LoggerService,
	) {
		super();
		this.telegramService.addMyCommands([
			// { command: BOT_COMMANDS.START, description: 'Старт бота' },
			// { command: BOT_COMMANDS.STOP, description: 'Остановить бота' },
			{ command: BOT_COMMANDS.CONNECT, description: 'Связать с аккаунт' },
		]);
	}

	@Start()
	async handleStartCommand(@Ctx() ctx: MyContext) {
		// const config = await this.botConfigService.findByUserId(ctx.user.id);
		// const text = config
		// 	? `Проверяйте данные на корректность!\n\n${this.formatConfigText(config)}`
		// 	: 'Перед старторм нужно конфигурироввать через команду, /editconfig';
		// await ctx.reply(text, {
		// 	reply_markup: config
		// 		? {
		// 				inline_keyboard: [
		// 					[
		// 						{
		// 							text: 'Изменить настройку',
		// 							callback_data: BOT_COMMANDS.EDIT_CONFIG,
		// 						},
		// 					],
		// 					[
		// 						{
		// 							text: 'Начать',
		// 							callback_data:
		// 								CALLBACK_ACTIONS.CONFIRM_START,
		// 						},
		// 						{
		// 							text: 'Отмена',
		// 							callback_data:
		// 								CALLBACK_ACTIONS.CANCEL_START,
		// 						},
		// 					],
		// 				],
		// 			}
		// 		: undefined,
		// });
	}

	@Command(BOT_COMMANDS.CONNECT)
	async connectCommand(@Ctx() ctx: MyContext) {
		// @ts-ignore
		ctx.session ??= {};
		// @ts-ignore
		ctx.session.waitingForConnectAnswer = true;

		await ctx.reply('Введите username');
	}

	@Command(BOT_COMMANDS.STOP)
	async handleStopCommand(@Ctx() ctx: MyContext) {
		// this.tradingBotService
		// 	.stopReverseBot(
		// 		{
		// 			userId: ctx.user.id,
		// 			exchange: ExchangeEnum.Bybit,
		// 		},
		// 		async (msg) => {
		// 			await ctx.reply(msg).catch((err) => {
		// 				console.log(err.message);
		// 			});
		// 		},
		// 	)
		// 	.catch(async (err) => {
		// 		await ctx.reply(err.message);
		// 	});
	}

	@Action([CALLBACK_ACTIONS.CONFIRM_START, CALLBACK_ACTIONS.CANCEL_START])
	async handleStartConfirmation(@Ctx() ctx: MyContext) {
		// const action = (ctx.callbackQuery as any).data;
		// await ctx.answerCbQuery();
		// await ctx.editMessageReplyMarkup(undefined);
		// if (action === CALLBACK_ACTIONS.CONFIRM_START) {
		// 	this.tradingBotService
		// 		.startReverseBot(
		// 			{
		// 				userId: ctx.user.id,
		// 				exchange: ExchangeEnum.Bybit,
		// 			},
		// 			async (msg) => {
		// 				await ctx.reply(msg).catch((err) => {
		// 					console.log(err.message);
		// 				});
		// 			},
		// 		)
		// 		.catch(async (err) => {
		// 			await ctx.reply(err.message);
		// 		});
		// } else {
		// 	await ctx.reply('Операция отменена');
		// }
	}

	@On('text')
	async onText(@Ctx() ctx: MyContext) {
		// @ts-ignore
		if (ctx.session?.waitingForConnectAnswer) {
			const username = ctx.text;

			const user = await this.userService.findByUsername(username!);

			if (!user) {
				ctx.reply('Пользователь не найден!');
			} else {
				await this.telegramPreferencesService.save({
					chatId: ctx.chat?.id,
					firstName: ctx.from?.first_name,
					telegramUserId: ctx.from?.id,
					username: ctx.from?.username,
					userId: user.id,
				});

				ctx.reply('Успешно!');
			}

			// @ts-ignore
			ctx.session.waitingForConnectAnswer = false;
		}
	}
}
