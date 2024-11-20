import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { TradingBotSimulatorEntity } from './trading-bot-simulator.service-entity';

@Entity('trading_bot_simulator_stats')
export class TradingBotSimulatorStatsEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'real' })
	openPrice: number;

	@Column({ type: 'real' })
	highestPrice: number;

	@Column({ type: 'real' })
	lowestPrice: number;

	@Column({ type: 'real' })
	closePrice: number;

	@Index()
	@Column()
	botId: number;

	@OneToOne(() => TradingBotSimulatorEntity, {
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	@JoinColumn()
	bot: TradingBotSimulatorEntity;

	@CreateDateColumn()
	createdAt: Date;
}
