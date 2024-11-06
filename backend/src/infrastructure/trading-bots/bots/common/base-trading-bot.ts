import TelegramService from '@/infrastructure/services/telegram/telegram.service';
import { Inject, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export abstract class BaseTradingBot {
	protected userId: number;
	protected botId: number;

	@Inject(TelegramService)
	private readonly telegramService: TelegramService;

	protected async sendMessage(message: string) {
		this.telegramService.sendMessage(this.userId, message);
	}
}
