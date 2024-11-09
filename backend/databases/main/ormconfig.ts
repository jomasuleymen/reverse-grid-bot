import path from 'path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import dotenv from 'dotenv';
dotenv.config();

const infraPath = path.resolve('src/infrastructure');

export const mainDataSource = new DataSource({
	type: 'better-sqlite3',
	database: path.join(__dirname, 'data.sqlite'),
	entities: [path.join(infraPath, '**/*.entity{.ts,.js}')],
	migrations: [path.join(infraPath, 'migrations/main/**/*.ts')],
	namingStrategy: new SnakeNamingStrategy(),
	synchronize: false,
	migrationsRun: false,
});
