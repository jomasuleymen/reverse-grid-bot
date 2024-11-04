import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeCredentialsEntity } from './entites/exchange-credentials.entity';
import { ExchangeCredentialsService } from './exchange-credentials.service';

@Module({
	imports: [TypeOrmModule.forFeature([ExchangeCredentialsEntity])],
	providers: [ExchangeCredentialsService],
	exports: [ExchangeCredentialsService],
})
export class ExchangeCredentialsModule {}
