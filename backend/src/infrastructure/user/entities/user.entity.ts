import { TelegramAccountEntity } from '@/infrastructure/notification/entities/telegram-account.entity';
import { Exclude } from 'class-transformer';
import {
	Column,
	Entity,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { ExchangeCredentialsEntity } from '../../trading-bots/entities/exchang-credentials.entity';
import { TradingBotConfigEntity } from '../../trading-bots/entities/trading-config.entity';

@Entity('user')
export class UserEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
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
