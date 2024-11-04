import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramAccountEntity } from './entities/telegram-account.entity';
import { TelegramPreferencesService } from './telegram-preferences.service';

@Module({
	imports: [TypeOrmModule.forFeature([TelegramAccountEntity])],
	providers: [TelegramPreferencesService],
	exports: [TelegramPreferencesService],
})
export class NotificationModule {}
