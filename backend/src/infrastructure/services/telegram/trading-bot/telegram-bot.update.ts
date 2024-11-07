import { MyContext } from '@/domain/adapters/telegram.interface';
import { TelegramPreferencesService } from '@/infrastructure/notification/telegram-preferences.service';
import TelegramService from '@/infrastructure/services/telegram/telegram.service';
import { UserService } from '@/infrastructure/user/user.service';
import { Command, Ctx, On, Update } from 'nestjs-telegraf';
import { TradingUpdateBase } from './common';

const BOT_COMMANDS = {
	START: 'start',
	STOP: 'stop',
	CONNECT: 'connect',
};

@Update()
export class TradingBotUpdate extends TradingUpdateBase {
	constructor(
		private readonly telegramService: TelegramService,
		private readonly userService: UserService,
		private readonly telegramPreferencesService: TelegramPreferencesService,
	) {
		super();
		this.telegramService.addMyCommands([
			{ command: BOT_COMMANDS.CONNECT, description: 'Связать с аккаунт' },
		]);
	}

	@Command(BOT_COMMANDS.CONNECT)
	async connectCommand(@Ctx() ctx: MyContext) {
		// @ts-ignore
		ctx.session ??= {};
		// @ts-ignore
		ctx.session.waitingForConnectAnswer = true;

		await ctx.reply('Введите username');
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
