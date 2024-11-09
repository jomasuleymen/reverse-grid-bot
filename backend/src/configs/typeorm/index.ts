import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const infraPath = path.join(__dirname, '../../infrastructure');

export enum DATABASES {
	SERVICE_DB = 'SERVICE_DB',
}

export const getMainOrmOptions = (): TypeOrmModuleOptions =>
	({
		type: 'better-sqlite3',
		database: path.resolve('databases', 'main', 'data.sqlite'),
		entities: [path.join(infraPath, '**/*.entity{.ts,.js}')],
		migrations: [path.join(infraPath, 'migrations/main/**/*.ts')],
		autoLoadEntities: true,
		synchronize: false,
		namingStrategy: new SnakeNamingStrategy(),
		logging: false,
	}) as TypeOrmModuleOptions;

export const getServiceOrmOptions = (): TypeOrmModuleOptions =>
	({
		type: 'better-sqlite3',
		database: path.resolve('databases', 'service', 'data.sqlite'),
		entities: [path.join(infraPath, '**/*.service-entity{.ts,.js}')],
		migrations: [path.join(infraPath, 'migrations/service/**/*.ts')],
		autoLoadEntities: true,
		synchronize: false,
		namingStrategy: new SnakeNamingStrategy(),
		logging: false,
	}) as TypeOrmModuleOptions;
