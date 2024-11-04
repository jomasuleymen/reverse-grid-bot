import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('kline')
export class KLineEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Index()
	@Column({
		type: 'varchar',
	})
	symbol: string;

	@Index()
	@Column({
		type: 'varchar',
	})
	category: string;

	@Index()
	@Column({ type: 'bigint' })
	startTime: number;

	@Column({
		type: 'numeric',
		precision: 15,
		scale: 8,
	})
	openPrice: number;

	@Column({
		type: 'numeric',
		precision: 15,
		scale: 8,
	})
	highPrice: number;

	@Column({
		type: 'numeric',
		precision: 15,
		scale: 8,
	})
	lowPrice: number;

	@Column({
		type: 'numeric',
		precision: 15,
		scale: 8,
	})
	closePrice: number;

	@Column({
		type: 'numeric',
		precision: 15,
		scale: 8,
	})
	volume: number;

	@Column({
		type: 'numeric',
		precision: 15,
		scale: 8,
	})
	turnover: number;

	@Index()
	@Column({
		type: 'integer',
	})
	exchange: ExchangeEnum;
}
