import { BadRequestException, ValidationError } from '@nestjs/common';

export class ValidationException extends BadRequestException {
	constructor(errors: ValidationError[]) {
		const validationErrors = errors.map((error) => ({
			property: error.property,
			constraints: Object.values(error?.constraints || {}),
		}));

		super({
			message: 'Validation error',
			validationErrors,
		});
	}
}
