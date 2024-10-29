import { UserEntity } from '@/infrastructure/entities/account/user.entity';
import { Injectable } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export abstract class IBotCommand {
	command: string;
	description: string;

	abstract exec(
		msg: TelegramBot.Message,
		bot: TelegramBot,
		user: UserEntity,
	): Promise<any>;
}

@Injectable()
export abstract class IBotCallbackQuery {
	abstract isMatch(data: string): boolean;
	abstract exec(
		query: TelegramBot.CallbackQuery,
		bot: TelegramBot,
		user: UserEntity,
	): Promise<any>;
}
