import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import {
	BotState,
	ExchangeCredentialsType,
	TradePosition,
} from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { ExchangeCredentialsEntity } from '@/infrastructure/exchanges/exchange-credentials/entites/exchange-credentials.entity';
import { UserEntity } from '@/infrastructure/user/entities/user.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { TradingBotOrdersEntity } from './trading-bot-orders.entity';

@Entity('trading_bot')
export class TradingBotEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Index()
	@Column({
		type: 'text',
	})
	type: ExchangeCredentialsType;

	@Index()
	@Column({ type: 'text' })
	exchange: ExchangeEnum;

	@Column({ nullable: true })
	name?: string;

	@Column()
	baseCurrency: string;

	@Column()
	quoteCurrency: string;

	@Column({ type: 'integer', nullable: true })
	takeProfitOnGrid?: number;

	@Column({ type: 'real', nullable: true })
	takeProfit?: number;

	@Column({ type: 'real', nullable: true })
	takeProfitOnPnl?: number;

	@Column({ type: 'real', nullable: true })
	triggerPrice?: number;

	@Column({ type: 'real' })
	gridStep: number;

	@Column({ type: 'real' })
	gridVolume: number;

	@Column({ type: 'integer', default: TradePosition.LONG })
	position: TradePosition;

	@Index()
	@Column({ type: 'integer', default: BotState.Idle })
	state: BotState;

	@Column({ type: 'boolean', default: true })
	tradeOnStart: boolean;

	@Index()
	@Column()
	userId: number;

	@Index()
	@Column({ nullable: true })
	proxyId: number;

	@Index()
	@Column({ nullable: true })
	credentialsId: number;

	@CreateDateColumn()
	createdAt: Date;

	@Column({ nullable: true })
	stoppedAt: Date;

	@Column({ nullable: true })
	stopReason: string;

	@OneToMany(() => TradingBotOrdersEntity, (orders) => orders.bot, {
		cascade: ['insert', 'update'],
	})
	orders: TradingBotOrdersEntity[];

	@ManyToOne(() => UserEntity, (user) => user.tradingBots, {
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	user: UserEntity;

	@ManyToOne(
		() => ExchangeCredentialsEntity,
		(credentials) => credentials.tradingBots,
		{
			onDelete: 'SET NULL',
			onUpdate: 'CASCADE',
		},
	)
	credentials: ExchangeCredentialsEntity;
}
