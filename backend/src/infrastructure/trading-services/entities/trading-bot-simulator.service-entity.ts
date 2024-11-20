import { TradePosition } from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { TradingBotSimulatorStatus } from '@/domain/interfaces/trading-services/trading-services.interface';
import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { TradingBotSimulatorOrderEntity } from './trading-bot-simulator-orders.service-entity';
import { TradingBotSimulatorStatsEntity } from './trading-bot-simulator-stats.service-entity';

@Entity('trading_bot_simulator')
export class TradingBotSimulatorEntity {
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

	@Column({ type: 'integer', default: TradePosition.LONG })
	position: TradePosition;

	@Column({ type: 'integer' })
	startTime: number;

	@Column({ type: 'integer' })
	endTime: number;

	@Column({ type: 'integer' })
	status: TradingBotSimulatorStatus;

	@OneToOne(() => TradingBotSimulatorStatsEntity, (stats) => stats.bot, {
		cascade: ['insert', 'update'],
	})
	stats: TradingBotSimulatorStatsEntity;

	@OneToMany(() => TradingBotSimulatorOrderEntity, (order) => order.bot, {
		cascade: ['insert', 'update'],
	})
	orders: TradingBotSimulatorOrderEntity[];

	@CreateDateColumn()
	createdAt: Date;
}
