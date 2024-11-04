import { KLineEntity } from '@/infrastructure/entities/trading/kline';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class KLineRepository {
	constructor(
		@InjectRepository(KLineEntity)
		private readonly klineRepo: Repository<KLineEntity>,
	) {}
}
