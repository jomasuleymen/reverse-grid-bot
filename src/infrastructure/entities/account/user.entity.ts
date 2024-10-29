import {
	Column,
	Entity,
	Index,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
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
}
