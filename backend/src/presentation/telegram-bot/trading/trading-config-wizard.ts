import { MyContext, WIZARDS } from '@/domain/adapters/telegram.interface';
import { TelegramAccountEntity } from '@/infrastructure/entities/notification/telegram-account.entity';
import { TelegramAccountRepository } from '@/infrastructure/repositories/account/telegram-account.repo';
import { BotConfigRepository } from '@/infrastructure/repositories/trading/trading-config.repo';
import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import {
	CALLBACK_ACTIONS,
	EDIT_CONFIG_FIELD_PREFIX,
} from '../common/constants';
import { FieldKey, formFieldConfig, TradingUpdateBase } from './common';

@Wizard(WIZARDS.TRADING_EDIT_CONFIG)
export class EditConfigWizard extends TradingUpdateBase {
	constructor(
		private readonly botConfigRepo: BotConfigRepository,
		private readonly telegramAccountRepo: TelegramAccountRepository,
	) {
		super();
	}

	private async fetchUser(ctx: MyContext) {
		return (await this.telegramAccountRepo.findByTelegramUserId(
			ctx.from?.id!,
		)) as TelegramAccountEntity;
	}

	private async fetchUserConfig(userId: number) {
		return (await this.botConfigRepo.findByUserId(userId, {
			createIfNotExists: true,
		}))!;
	}

	@WizardStep(1)
	async handleSceneEnter(@Ctx() ctx: MyContext) {
		const user = await this.fetchUser(ctx);
		if (!user?.id) {
			await ctx.reply('Ошибка произошла');
			return await ctx.scene.leave();
		}

		const config = await this.fetchUserConfig(user.id);

		await this.removePreviousKeyboards(ctx);

		const response = await ctx.reply(
			this.formatConfigText(config),
			this.createConfigKeyboard(),
		);

		(ctx.wizard.state as any).prevMsgId = response.message_id;
	}

	private async removePreviousKeyboards(ctx: MyContext) {
		const state = ctx.wizard.state as any;
		if (state?.prevMsgId) {
			await ctx.telegram.editMessageReplyMarkup(
				ctx.chat?.id,
				state.prevMsgId,
				undefined,
				undefined,
			);
			state.prevMsgId = null;
		}
	}

	@WizardStep(2)
	async handleNewValueInput(@Ctx() ctx: MyContext) {
		const field = (ctx.wizard.state as any).field as FieldKey;
		const newValue = ctx.text;

		await this.removePreviousKeyboards(ctx);

		const fieldConfig = formFieldConfig[field];
		if (!fieldConfig.validation(newValue)) {
			const message = await ctx.reply(
				'Please enter a valid value.',
				Markup.inlineKeyboard([this.cancelButton()]),
			);
			(ctx.wizard.state as any).prevMsgId = message.message_id;
			return;
		}
		const user = await this.fetchUser(ctx);
		const config = await this.fetchUserConfig(user.id);

		// @ts-ignore
		config[fieldConfig.dbField] = fieldConfig.parse(newValue);
		await this.botConfigRepo.save(config);

		return await ctx.scene.reenter();
	}

	@Action(new RegExp(`^${EDIT_CONFIG_FIELD_PREFIX}`))
	async handleFieldEditSelection(@Ctx() ctx: MyContext) {
		const field = this.parseFieldFromCallback(
			(ctx.callbackQuery as any).data as string,
		);
		(ctx.wizard.state as any).field = field;
		(ctx.wizard.state as any).prevMsgId = null;

		const fieldConfig = formFieldConfig[field];

		if (fieldConfig.options) {
			await ctx.editMessageReplyMarkup(undefined);
			await ctx.reply(
				fieldConfig.inputPrompt,
				Markup.keyboard(
					fieldConfig.options.map((opt) => Markup.button.text(opt)),
				)
					.oneTime()
					.resize(),
			);
		} else {
			await ctx.editMessageText(fieldConfig.inputPrompt);
		}

		await ctx.wizard.next();
	}

	@Action(CALLBACK_ACTIONS.CANCEL_CONFIG_EDITING)
	async handleCancelEdit(@Ctx() ctx: MyContext) {
		const user = await this.fetchUser(ctx);
		const config = await this.fetchUserConfig(user.id);

		await ctx.editMessageText(this.formatConfigText(config), {
			reply_markup: undefined,
		});
		return await ctx.scene.leave();
	}
}
