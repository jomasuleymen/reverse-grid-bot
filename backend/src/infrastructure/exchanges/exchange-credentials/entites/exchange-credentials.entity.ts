import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import { ExchangeCredentialsType } from '@/domain/interfaces/trading-bots/trading-bot.interface';
import { TradingBotEntity } from '@/infrastructure/trading-bots/entities/trading-bots.entity';
import { UserEntity } from '@/infrastructure/user/entities/user.entity';
import { Exclude } from 'class-transformer';
import {
	Column,
	Entity,
	Index,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('exchange_credentials')
export class ExchangeCredentialsEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Index()
	@Column({
		type: 'text',
		default: ExchangeCredentialsType.Testnet,
	})
	type: ExchangeCredentialsType;

	@Column({
		type: 'text',
		default: '',
	})
	name: string;

	@Column()
	@Exclude()
	apiKey: string;

	@Column()
	@Exclude()
	apiSecret: string;

	@Index()
	@Column({ type: 'text' })
	exchange: ExchangeEnum;

	@Index()
	@Column()
	userId: number;

	@ManyToOne(() => UserEntity, (user) => user.exchangeAccounts, {
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	user: UserEntity;

	@OneToMany(() => TradingBotEntity, (tradingBot) => tradingBot.credentials, {
		cascade: ['insert', 'update'],
	})
	tradingBots: TradingBotEntity[];
}
