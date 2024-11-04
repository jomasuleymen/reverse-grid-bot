import { ExchangeCredentialsType } from '@/domain/interfaces/trading-bots/trading-bot.interface.interface';
import { UserEntity } from '@/infrastructure/entities/account/user.entity';
import { IsEnum, IsNumber, IsString } from 'class-validator';
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

	@IsNumber({}, { message: 'Тейк профит должен быть числом.' })
	@Column({ type: 'real', nullable: true })
	takeProfit: number;

	@IsNumber({}, { message: 'Шаг сетки должен быть числом.' })
	@Column({ type: 'real', nullable: true })
	gridStep: number;

	@IsNumber({}, { message: 'Объём сетки должен быть числом.' })
	@Column({ type: 'real', nullable: true })
	gridVolume: number;

	@IsString({ message: 'Символ должен быть строкой.' })
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
