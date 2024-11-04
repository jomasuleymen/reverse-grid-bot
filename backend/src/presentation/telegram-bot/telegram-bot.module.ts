import { ServicesModule } from '@/application/services.module';
import { MyContext } from '@/domain/adapters/telegram.interface';
import { TelegramAccountRepository } from '@/infrastructure/repositories/account/telegram-account.repo';
import { RepositoriesModule } from '@/infrastructure/repositories/repositories.module';
import { TelegramModule } from '@/infrastructure/services/telegram/telegram.module';
import TelegramService from '@/infrastructure/services/telegram/telegram.service';
import { Module, OnModuleInit } from '@nestjs/common';
import { Ctx, InjectBot, Next, Update, Use } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { EditConfigWizard } from './trading/trading-config-wizard';
import { TradingTelegramUpdate } from './trading/trading-update';

@Module({
	imports: [RepositoriesModule, TelegramModule, ServicesModule],
	providers: [TradingTelegramUpdate, EditConfigWizard],
})
@Update()
export class TelegramBotModule implements OnModuleInit {
	constructor(
		@InjectBot() public readonly bot: Telegraf,
		private readonly telegramAccountRepo: TelegramAccountRepository,
		private readonly telegramService: TelegramService,
	) {}

	onModuleInit() {
		this.telegramService.updateBotCommands();
	}

	@Use()
	async validateUser(@Ctx() ctx: MyContext, @Next() next: any) {
		if (ctx.from?.is_bot) return;

		const userId = ctx.from?.id;

		let account = await this.telegramAccountRepo.findByTelegramUserId(
			userId!,
		);
		if (!account) {
			await ctx.reply(`У вас нету доступа. user id: ${userId}`);
			return;
		}

		return await next();
	}
}
