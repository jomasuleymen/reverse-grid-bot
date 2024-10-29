import { MyContext } from '@/domain/adapters/telegram.interface';
import { UserRepository } from '@/infrastructure/repositories/account/user.repo';
import { RepositoriesModule } from '@/infrastructure/repositories/repositories.module';
import { TelegramModule } from '@/infrastructure/services/telegram/telegram.module';
import TelegramService from '@/infrastructure/services/telegram/telegram.service';
import { Module, OnModuleInit } from '@nestjs/common';
import { Ctx, InjectBot, Next, Update, Use } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { EditConfigWizard } from './trading/trading-config-wizard';
import { TradingTelegramUpdate } from './trading/trading-update';

@Module({
	imports: [RepositoriesModule, TelegramModule],
	providers: [TradingTelegramUpdate, EditConfigWizard],
})
@Update()
export class TelegramBotModule implements OnModuleInit {
	constructor(
		@InjectBot() public readonly bot: Telegraf,
		private readonly userRepo: UserRepository,
		private readonly telegramService: TelegramService,
	) {}

	onModuleInit() {
		this.telegramService.updateBotCommands();
	}

	@Use()
	async validateUser(@Ctx() ctx: MyContext, @Next() next: any) {
		if (ctx.from?.is_bot) return;

		const userId = ctx.from?.id;

		if (!userId || !this.telegramService.isUserAllowed(userId)) {
			await ctx.reply(`У вас нету доступа. user id: ${userId}`);
			return;
		}

		let user = await this.userRepo.findByTelegramUserId(userId!);
		if (!user)
			user = await this.userRepo.saveUser({
				chatId: ctx.chat?.id,
				telegramUserId: userId!,
				firstName: ctx.from?.first_name!,
				username: ctx.from?.username!,
			});

		ctx.user = user;

		return await next();
	}
}
