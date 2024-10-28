import { KLineEntity } from '@/infrastructure/entities/trading/kline.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class KLineRepo {
	constructor(
		@InjectRepository(KLineEntity)
		private readonly klineRepo: Repository<KLineEntity>,
	) {}
}
