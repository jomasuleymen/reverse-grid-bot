import { IBotCommand } from '@/domain/adapters/telegram.interface';
import TelegramBot, { Message } from 'node-telegram-bot-api';

class StartTradingCommand extends IBotCommand {
	command = 'start';
	description = 'Старт';

	async exec(msg: Message, bot: TelegramBot) {
		bot.sendMessage(msg.chat.id, 'Start button clicked');
	}
}

export class StopTradingCommand extends IBotCommand {
	command = 'stop';
	description = 'Закрыть позицию';

	async exec(msg: Message, bot: TelegramBot) {
		bot.sendMessage(msg.chat.id, 'Stop button clicked');
	}
}

export const TRADING_STATE_COMMANDS = [StartTradingCommand, StopTradingCommand];
