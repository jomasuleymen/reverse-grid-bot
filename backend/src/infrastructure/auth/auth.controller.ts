import { AuthGuard } from '@/common/guards/auth.guard';
import { LocalLoginGuard } from '@/common/guards/passport/login.guard';
import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
	@UseGuards(LocalLoginGuard)
	@Post('login')
	async login(@Req() req: Request) {
		return req.user;
	}

	@UseGuards(AuthGuard)
	@Post('logout')
	async logout(@Req() req: Request) {
		return req.logout((err) => {});
	}

	@UseGuards(AuthGuard)
	@Get('me')
	async me(@Req() req: Request) {
		return req.user;
	}
}
