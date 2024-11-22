import { NotificationModule } from '@/infrastructure/notification/notification.module';
import { UserModule } from '@/infrastructure/user/user.module';
import { Global, Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Global()
@Module({
	imports: [UserModule, NotificationModule],
	providers: [TelegramService],
	exports: [TelegramService],
})
export class TelegramModule {}
