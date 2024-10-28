import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { REPOSITORIES } from '.';
import { getTypeOrmModuleOptions } from '../configs/typeorm';
import { ENTITIES } from '../entities';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [],
			inject: [],
			useFactory: getTypeOrmModuleOptions,
		}),
		TypeOrmModule.forFeature([...ENTITIES]),
	],
	providers: [...REPOSITORIES],
	exports: [...REPOSITORIES],
})
export class RepositoriesModule {}
