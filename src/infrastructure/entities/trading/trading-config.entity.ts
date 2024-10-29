import {
	Column,
	Entity,
	Index,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../account/user.entity';

@Entity('trading_bot_config')
export class TradingBotConfigEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: true })
	closeAtPrice: number;

	@Index()
	@Column()
	userId: number;

	@OneToOne(() => UserEntity, (user) => user.botConfig, {
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	@JoinColumn()
	user: UserEntity;
}
