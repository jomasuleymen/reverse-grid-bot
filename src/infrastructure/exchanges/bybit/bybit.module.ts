import { Module } from '@nestjs/common';
import { BybitSpotService } from './services/spot';

@Module({
	imports: [],
	providers: [BybitSpotService],
	exports: [BybitSpotService],
})
export class BybitModule {}
