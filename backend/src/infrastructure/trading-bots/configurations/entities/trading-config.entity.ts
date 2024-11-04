import { UserEntity } from '@/infrastructure/user/entities/user.entity';
import {
	Column,
	Entity,
	Index,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('trading_bot_config')
export class TradingBotConfigEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'real', nullable: true })
	takeProfit: number;

	@Column({ type: 'real', nullable: true })
	gridStep: number;

	@Column({ type: 'real', nullable: true })
	gridVolume: number;

	@Column({ nullable: true })
	symbol: string;

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
