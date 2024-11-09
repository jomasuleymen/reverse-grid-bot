import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { ReverseGridBotConfigEntity } from './reverse-grid-bot-configs.service-entity';

@Entity('reverse_grid_bot_stats')
export class ReverseGridBotStatsEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'integer' })
	buyCount: number;

	@Column({ type: 'integer' })
	sellCount: number;

	@Column({ type: 'real' })
	openPrice: number;

	@Column({ type: 'real' })
	closePrice: number;

	@Column({ type: 'real' })
	highestPrice: number;

	@Column({ type: 'real' })
	lowestPrice: number;

	@Column({ type: 'real' })
	totalProfit: number;

	@Column({ type: 'real' })
	totalFee: number;

	@Column({ type: 'real' })
	realizedPnL: number;

	@Column({ type: 'real' })
	unrealizedPnL: number;

	@Column({ type: 'real' })
	PnL: number;

	@Column({ type: 'real' })
	maxPnL: number;

	@OneToMany(() => ReverseGridBotConfigEntity, (config) => config.result, {
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	configs: ReverseGridBotConfigEntity[];

	@CreateDateColumn()
	createdAt: Date;
}
