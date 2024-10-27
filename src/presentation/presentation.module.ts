import { Module } from '@nestjs/common';
import { TelegramBotCommandsModule } from './telegram-bot/bot-commands.module';

@Module({
	imports: [TelegramBotCommandsModule],
})
export class PresentationModule {}
