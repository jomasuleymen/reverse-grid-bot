import { ExchangeEnum } from '@/domain/interfaces/exchanges/common.interface';
import { ExchangeCredentialsType } from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import {
	Column,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserEntity } from '@/infrastructure/user/entities/user.entity';

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
}
