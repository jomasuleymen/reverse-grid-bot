import { Exclude } from 'class-transformer';
import {
	Column,
	Entity,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { TelegramAccountEntity } from '../notification/telegram-account.entity';
import { ExchangeCredentialsEntity } from '../trading/exchang-credentials.entity';
import { TradingBotConfigEntity } from '../trading/trading-config.entity';

@Entity('user')
export class UserEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({unique: true})
	username: string;

	@Exclude()
	@Column()
	password: string;

	@OneToOne(() => TradingBotConfigEntity, (botConfig) => botConfig.user, {
		cascade: ['insert', 'update'],
	})
	botConfig: TradingBotConfigEntity;

	@OneToOne(
		() => TelegramAccountEntity,
		(telegramAccount) => telegramAccount.user,
		{
			cascade: ['insert', 'update'],
		},
	)
	telegramAccount: TelegramAccountEntity;

	@OneToMany(
		() => ExchangeCredentialsEntity,
		(exchangeAccount) => exchangeAccount.user,
		{
			cascade: ['insert', 'update'],
		},
	)
	exchangeAccounts: ExchangeCredentialsEntity[];
}
