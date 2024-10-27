import { IBotCommand } from '@/domain/adapters/telegram.interface';
import TelegramBot, { Message } from 'node-telegram-bot-api';

export class StopTradingCommand implements IBotCommand {
	public command = '/stop';
	public description = 'Закрыть позицию';

	exec(msg: Message, bot: TelegramBot) {
		bot.sendMessage(msg.chat.id, 'Stop button clicked');
	}
}
