import {
	Column,
	Entity,
	Index,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('telegram-account')
export class TelegramAccountEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Index()
	@Column({ unique: true })
	telegramUserId: number;

	@Index()
	@Column({ unique: true })
	chatId: number;

	@Column()
	firstName: string;

	@Column()
	username: string;

	@Index()
	@Column()
	userId: number;

	@OneToOne(() => UserEntity, (user) => user.telegramAccount, {
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	@JoinColumn()
	user: UserEntity;
}
