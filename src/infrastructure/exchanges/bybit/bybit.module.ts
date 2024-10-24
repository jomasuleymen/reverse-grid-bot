import { Module } from '@nestjs/common';
import { BybitSpotAlgo1 } from './algos/spot-algo-1';

@Module({
	imports: [],
	providers: [BybitSpotAlgo1],
	exports: [BybitSpotAlgo1],
})
export class BybitModule {}
