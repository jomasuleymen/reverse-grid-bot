import { Module } from '@nestjs/common';
import { BybitService } from './bybit.service';

@Module({
	imports: [],
	providers: [BybitService],
	exports: [BybitService],
})
export class BybitModule {}
