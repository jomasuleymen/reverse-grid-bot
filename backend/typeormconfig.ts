import path from 'path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import dotenv from 'dotenv';
dotenv.config();

console.log(`Migrations started to work`);

const infraPath = path.resolve('src/infrastructure');

export const appDataSource = new DataSource({
	type: 'better-sqlite3',
	database: path.resolve('data.sqlite'),
	entities: [path.join(infraPath, '**/*.entity{.ts,.js}')],
	migrations: [path.join(infraPath, 'migrations/**/*.ts')],
	namingStrategy: new SnakeNamingStrategy(),
	synchronize: false,
	migrationsRun: false,
});
