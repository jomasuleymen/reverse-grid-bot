import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import {
	Column,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { TradingBotSimulatorEntity } from './trading-bot-simulator.service-entity';

@Entity('trading_bot_simulator_orders')
export class TradingBotSimulatorOrderEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	feeCurrency: string;

	@Column({ type: 'real' })
	avgPrice: number;

	@Column({ type: 'real', nullable: true })
	triggerPrice: number;

	@Column({ type: 'real' })
	quantity: number;

	@Column({ type: 'text' })
	side: OrderSide;

	@Column({ type: 'real' })
	fee: number;

	@Column()
	createdDate: Date;

	@Index()
	@Column()
	botId: number;

	@ManyToOne(
		() => TradingBotSimulatorEntity,
		(tradingBot) => tradingBot.orders,
		{
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		},
	)
	bot: TradingBotSimulatorEntity;
}
