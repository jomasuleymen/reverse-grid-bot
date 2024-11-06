import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const infraPath = path.join(__dirname, '../../infrastructure');
export const getTypeOrmModuleOptions = (): TypeOrmModuleOptions =>
	({
		type: 'better-sqlite3',
		database: path.resolve('data.sqlite'),
		entities: [path.join(infraPath, '**/*.entity{.ts,.js}')],
		autoLoadEntities: true,
		synchronize: false,
		namingStrategy: new SnakeNamingStrategy(),
		logging: false,
	}) as TypeOrmModuleOptions;