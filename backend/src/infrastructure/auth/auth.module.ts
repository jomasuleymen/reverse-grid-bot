import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionSerializer } from './passport/session-serializer';
import { LocalStrategy } from './passport/local.strategy';

@Module({
	imports: [PassportModule, UserModule],
	controllers: [AuthController],
	providers: [AuthService, LocalStrategy, SessionSerializer],
})
export class AuthModule {}
