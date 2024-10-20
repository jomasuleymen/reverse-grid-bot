import { Module } from '@nestjs/common';

@Module({
	imports: [],
	providers: [],
})
export class BackgroundModule {
	onModuleInit() {
		console.log('BACKGROUND MODULE');
	}
}
