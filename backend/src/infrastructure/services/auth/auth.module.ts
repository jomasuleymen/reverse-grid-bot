import { RepositoriesModule } from '@/infrastructure/repositories/repositories.module';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SessionSerializer } from './serializers/session-serializer';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
	imports: [PassportModule, RepositoriesModule],
	providers: [AuthService, LocalStrategy, SessionSerializer],
})
export class AuthModule {}
