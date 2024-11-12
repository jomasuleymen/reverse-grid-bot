import { OrderSide } from '@/domain/interfaces/exchanges/common.interface';
import {
	Column,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { TradingBotEntity } from './trading-bots.entity';

@Entity('trading_bot_orders')
export class TradingBotOrdersEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	orderId: string;

	@Column()
	feeCurrency: string;

	@Column()
	customId: string;

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
	symbol: string;

	@Column()
	createdDate: Date;

	@Index()
	@Column()
	botId: number;

	@ManyToOne(() => TradingBotEntity, (tradingBot) => tradingBot.orders, {
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	bot: TradingBotEntity;
}
