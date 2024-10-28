import { IBotCommand } from '@/domain/adapters/telegram.interface';
import TelegramBot, { Message } from 'node-telegram-bot-api';

export class StartTradingCommand implements IBotCommand {
	public command = 'start';
	public description = 'Старт';

	exec(msg: Message, bot: TelegramBot) {
		bot.sendMessage(msg.chat.id, 'Start button clicked');
	}
}
