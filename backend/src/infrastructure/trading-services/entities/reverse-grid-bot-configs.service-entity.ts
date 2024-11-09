import { TradingBotSimulatorStatus } from '@/domain/interfaces/trading-services/trading-services.interface';
import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { ReverseGridBotStatsEntity } from './reverse-grid-bot-stats.service-entity';

@Entity('reverse_grid_bot_configs')
export class ReverseGridBotConfigEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'text' })
	baseCurrency: string;

	@Column({ type: 'text' })
	quoteCurrency: string;

	@Column({ type: 'real' })
	gridStep: number;

	@Column({ type: 'real' })
	gridVolume: number;

	@Column({ type: 'integer' })
	startTime: number;

	@Column({ type: 'integer' })
	endTime: number;

	@Column({ type: 'integer' })
	status: TradingBotSimulatorStatus;

	@ManyToOne(() => ReverseGridBotStatsEntity, (result) => result.configs)
	result: ReverseGridBotStatsEntity;

	@CreateDateColumn()
	createdAt: Date;
}
