import TelegramBot from 'node-telegram-bot-api';

export interface IBotCommand {
	command: string;
	description: string;

	exec(msg: TelegramBot.Message, bot: TelegramBot): any;
}
