import { UseAuthorized } from '@/common/decorators/use-auth.decorator';
import UseSession from '@/common/decorators/use-session.decorator';
import { UserSession } from '@/infrastructure/auth/dto/session-user.dto';
import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	Query,
} from '@nestjs/common';
import { GetTradingBotsDto } from './dto/get-bots.dto';
import { StartBotDto } from './dto/start-bot.dto';
import { StopBotDto } from './dto/stop-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { TradingBotOrdersService } from './trading-bot-orders.service';
import { TradingBotService } from './trading-bots.service';

@Controller('trading-bots')
@UseAuthorized()
export class TradingBotsController {
	constructor(
		private readonly tradingBotService: TradingBotService,
		private readonly tradingBotOrdersService: TradingBotOrdersService,
	) {}

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

	@Get('orders/:botId')
	async getBotOrders(
		@UseSession() user: UserSession,
		@Param('botId') botId: string,
	) {
		return await this.tradingBotOrdersService.findByBotId(+botId);
	}

	@Get('orders/:botId/summary')
	async getOrdersWithSummary(
		@UseSession() user: UserSession,
		@Param('botId') botId: string,
	) {
		return await this.tradingBotOrdersService.getWithSummary(+botId);
	}

	@Get(':id')
	async getBot(@Param('id') id: string, @UseSession() user: UserSession) {
		const bot = await this.tradingBotService.findBotById(+id);

		if (!bot) throw new BadRequestException('Бот не найден');

		return bot;
	}

	@Put(':id')
	async editBot(
		@Param('id') id: string,
		@Body() payload: UpdateBotDto,
		@UseSession() user: UserSession,
	) {
		return await this.tradingBotService.update(+id, payload);
	}
}
