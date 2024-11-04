import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import { ExchangeCredentialsType } from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import {
	Column,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../account/user.entity';

@Entity('exchange_account')
export class ExchangeCredentialsEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Index()
	@Column({
		type: 'integer',
		default: ExchangeCredentialsType.Testnet,
	})
	mode: ExchangeCredentialsType;

	@Column()
	apiKey: string;

	@Column()
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
}
