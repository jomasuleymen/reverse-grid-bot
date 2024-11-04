import { Module } from '@nestjs/common';
import { AuthContollerModule } from './default/auth/auth.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';

@Module({
	imports: [TelegramBotModule, AuthContollerModule],
	providers: [],
})
export class PresentationModule {}
