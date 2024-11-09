import { UseAuthorized } from '@/common/decorators/use-auth.decorator';
import UseSession from '@/common/decorators/use-session.decorator';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserSession } from '../auth/dto/session-user.dto';
import { StartTradingBotSimulatorDto } from './dto/start-trading-bot-simulator.dto';
import { TradingServicesService } from './trading-services.service';

@Controller('trading-services')
@UseAuthorized()
export class TradingServicesController {
	constructor(
		private readonly tradingServicesService: TradingServicesService,
	) {}

	@Post('reverse-grid-bot-simulator')
	async createReverseGridBotSimulator(
		@UseSession() user: UserSession,
		@Body() dto: StartTradingBotSimulatorDto,
	) {
		await this.tradingServicesService.addReverseGridBotSimulatorTask(
			user.id,
			dto,
		);

		return {
			message: 'Task added',
			success: true,
		};
	}

	@Get('reverse-grid-bot-simulator')
	async getAllReverseGridBotSimulators(@UseSession() user: UserSession) {
		return await this.tradingServicesService.findSimulatorResults(user.id);
	}
}
