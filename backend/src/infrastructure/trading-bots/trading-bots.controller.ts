import { UseAuthorized } from '@/common/decorators/use-auth.decorator';
import UseSession from '@/common/decorators/use-session.decorator';
import { UserSession } from '@/infrastructure/auth/dto/session-user.dto';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GetTradingBotsDto } from './dto/get-bots.dto';
import { StartBotDto } from './dto/start-bot.dto';
import { StopBotDto } from './dto/stop-bot.dto';
import { TradingBotService } from './trading-bots.service';

@Controller('trading-bots')
@UseAuthorized()
export class TradingBotsController {
	constructor(private readonly tradingBotService: TradingBotService) {}

	@Get()
	async getBots(
		@UseSession() user: UserSession,
		@Query() payload: GetTradingBotsDto,
	) {
		return await this.tradingBotService.findBotsByUserId(user.id, payload);
	}

	@Post('start')
	async startBot(
		@Body() query: StartBotDto,
		@UseSession() user: UserSession,
	) {
		return await this.tradingBotService.startBot(user.id, query);
	}

	@Post('stop')
	async stopBot(@Body() body: StopBotDto, @UseSession() user: UserSession) {
		return await this.tradingBotService.stopBot(user.id, body.botId);
	}
}
