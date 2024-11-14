import { UserEntity } from '@/infrastructure/user/entities/user.entity';
import {
	Column,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('trading_bot_config')
export class TradingBotConfigEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	baseCurrency: string;

	@Column()
	quoteCurrency: string;

	@Column({ type: 'integer' })
	takeProfitOnGrid: number;

	@Column({ type: 'real' })
	gridStep: number;

	@Column({ type: 'real' })
	gridVolume: number;

	@Index()
	@Column()
	userId: number;

	@ManyToOne(() => UserEntity, (user) => user.botConfigs, {
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	user: UserEntity;
}
