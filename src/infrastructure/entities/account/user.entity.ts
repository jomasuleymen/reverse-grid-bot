import {
	Column,
	Entity,
	Index,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { ExchangeCredentialsEntity } from '../trading/exchang-credentials.entity';
import { TradingBotConfigEntity } from '../trading/trading-config.entity';

@Entity('user')
export class UserEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Index()
	@Column({ unique: true })
	telegramUserId: number;

	@Index()
	@Column({ unique: true })
	chatId: number;

	@Column({ nullable: true })
	firstName: string;

	@Column({ nullable: true })
	username: string;

	@OneToOne(() => TradingBotConfigEntity, (botConfig) => botConfig.user, {
		cascade: ['insert', 'update'],
	})
	botConfig: TradingBotConfigEntity;

	@OneToMany(
		() => ExchangeCredentialsEntity,
		(exchangeAccount) => exchangeAccount.user,
		{
			cascade: ['insert', 'update'],
		},
	)
	exchangeAccounts: ExchangeCredentialsEntity[];
}
