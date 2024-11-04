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

export class EmailNotVerifiedException extends BadRequestException {
	constructor() {
		super({
			message: 'Email has not been verified',
			type: 'EmailNotVerifiedException',
		});
	}
}

export class SpecialistNotVerifiedException extends BadRequestException {
	constructor() {
		super({
			message:
				'Specialist has not been verified. Please wait for the admin to verify your account.',
			type: 'SpecialistNotVerifiedException',
		});
	}
}
