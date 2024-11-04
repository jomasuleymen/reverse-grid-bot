import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeCredentialsEntity } from './entites/exchange-credentials.entity';
import { ExchangeCredentialsController } from './exchange-credentials.controller';
import { ExchangeCredentialsService } from './exchange-credentials.service';

@Module({
	imports: [TypeOrmModule.forFeature([ExchangeCredentialsEntity])],
	controllers: [ExchangeCredentialsController],
	providers: [ExchangeCredentialsService],
	exports: [ExchangeCredentialsService],
})
export class ExchangeCredentialsModule {}
