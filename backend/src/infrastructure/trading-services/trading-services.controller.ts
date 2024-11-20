import { UseAuthorized } from '@/common/decorators/use-auth.decorator';
import UseSession from '@/common/decorators/use-session.decorator';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserSession } from '../auth/dto/session-user.dto';
import { StartTradingBotSimulatorDto } from './dto/start-trading-bot-simulator.dto';
import { BotSimulatorOrdersService } from './services/simulator-orders.service';
import { TradingServicesService } from './trading-services.service';

@Controller('trading-services')
@UseAuthorized()
export class TradingServicesController {
	constructor(
		private readonly tradingServicesService: TradingServicesService,
		private readonly ordersService: BotSimulatorOrdersService,
	) {}

	@Post('reverse-grid-bot-simulators')
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

	@Get('reverse-grid-bot-simulators')
	async getAllReverseGridBotSimulators(@UseSession() user: UserSession) {
		return await this.tradingServicesService.findSimulators(user.id);
	}

	@Get('reverse-grid-bot-simulators/:id')
	async getReverseGridBotSimulator(
		@UseSession() user: UserSession,
		@Param('id') botId: string | number,
	) {
		return await this.tradingServicesService.findSimulatorById(+botId);
	}

	@Get('reverse-grid-bot-simulators/:id/orders-summary')
	async getReverseGridBotSimulatorOrdersSummary(
		@UseSession() user: UserSession,
		@Param('id') botId: string | number,
	) {
		return await this.ordersService.getWithSummary(+botId);
	}
}
