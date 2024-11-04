import { UseAuthorized } from '@/common/decorators/use-auth.decorator';
import UseSession from '@/common/decorators/use-session.decorator';
import { UserSession } from '@/infrastructure/auth/dto/session-user.dto';
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
} from '@nestjs/common';
import { CreateBotConfigDto } from './dto/create-config.dto';
import { TradingBotConfigsService } from './trading-configs.service';

@Controller('trading-bots/configs')
@UseAuthorized()
export class TradingBotConfigsController {
	constructor(private readonly botConfigsSerice: TradingBotConfigsService) {}

	@Get()
	async getConfig(@UseSession() user: UserSession) {
		return await this.botConfigsSerice.findByUserId(user.id);
	}

	@Post()
	async saveConfig(
		@Body() body: CreateBotConfigDto,
		@UseSession() user: UserSession,
	) {
		return await this.botConfigsSerice.save(user.id, body);
	}

	@Delete(':id')
	async deleteConfig(
		@Param('id') id: string,
		@UseSession() user: UserSession,
	) {
		return await this.botConfigsSerice.delete(+id);
	}

	@Put(':id')
	async updateConfig(
		@Param('id') id: string,
		@Body() body: CreateBotConfigDto,
		@UseSession() user: UserSession,
	) {
		return await this.botConfigsSerice.update(+id, body);
	}
}
