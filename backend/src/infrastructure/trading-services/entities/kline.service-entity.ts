import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('kline')
@Unique(['symbol', 'openTime'])
export class KlineEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	symbol: string;

	@Index()
	@Column({ type: 'bigint' })
	openTime: number;

	@Column('decimal', { precision: 18, scale: 8 })
	open: number;

	@Column('decimal', { precision: 18, scale: 8 })
	high: number;

	@Column('decimal', { precision: 18, scale: 8 })
	low: number;

	@Column('decimal', { precision: 18, scale: 8 })
	close: number;

	@Column('decimal', { precision: 18, scale: 8 })
	volume: number;

	@Index()
	@Column({ type: 'bigint' })
	closeTime: number;

	@Column('decimal', { precision: 18, scale: 8 })
	quoteAssetVolume: number;

	@Column()
	numberOfTrades: number;

	@Column('decimal', { precision: 18, scale: 8 })
	takerBuyBaseAssetVolume: number;

	@Column('decimal', { precision: 18, scale: 8 })
	takerBuyQuoteAssetVolume: number;
}
