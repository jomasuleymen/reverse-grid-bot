import { UseAuthorized } from '@/common/decorators/use-auth.decorator';
import UseSession from '@/common/decorators/use-session.decorator';
import { UserSession } from '@/infrastructure/auth/dto/session-user.dto';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateCredentialsDto } from './dto/create-credentials.dto';
import { ExchangeCredentialsService } from './exchange-credentials.service';

@Controller('exchanges/credentials')
@UseAuthorized()
export class ExchangeCredentialsController {
	constructor(
		private readonly credentialsService: ExchangeCredentialsService,
	) {}

	@Get()
	async getCredentials(@UseSession() user: UserSession) {
		return await this.credentialsService.findByUserId(user.id);
	}

	@Post()
	async saveCredentials(
		@Body() body: CreateCredentialsDto,
		@UseSession() user: UserSession,
	) {
		return await this.credentialsService.save(user.id, body);
	}

	@Delete(':id')
	async deleteConfig(
		@Param('id') id: string,
		@UseSession() user: UserSession,
	) {
		return await this.credentialsService.delete(+id);
	}
}
