import { ExchangeCredentialsEntity } from '@/infrastructure/exchanges/exchange-credentials/entites/exchange-credentials.entity';
import { TelegramAccountEntity } from '@/infrastructure/notification/entities/telegram-account.entity';
import { Exclude } from 'class-transformer';
import {
	Column,
	Entity,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { TradingBotConfigEntity } from '../../trading-bots/configurations/entities/trading-config.entity';
import { TradingBotEntity } from '@/infrastructure/trading-bots/entities/trading-bots.entity';

@Entity('user')
export class UserEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	username: string;

	@Exclude()
	@Column()
	password: string;

	@OneToMany(() => TradingBotConfigEntity, (tradingBot) => tradingBot.user, {
		cascade: ['insert', 'update'],
	})
	tradingBots: TradingBotEntity[];

	@OneToMany(() => TradingBotConfigEntity, (botConfig) => botConfig.user, {
		cascade: ['insert', 'update'],
	})
	botConfigs: TradingBotConfigEntity[];

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
