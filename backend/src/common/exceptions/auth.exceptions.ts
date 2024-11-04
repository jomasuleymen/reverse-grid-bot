import { BadRequestException } from '@nestjs/common';

export class LoginFailedException extends BadRequestException {
	constructor() {
		super({
			message: 'Incorrect credentials',
			type: 'LoginFailedException',
		});
	}
}

export class SessionExpiredException extends BadRequestException {
	constructor() {
		super({
			message: 'Session has been expired',
			type: 'SessionExpiredException',
		});
	}
}
