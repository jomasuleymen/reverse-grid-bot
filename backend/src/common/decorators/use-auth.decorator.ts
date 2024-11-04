import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';

export const UseAuthorized = (): MethodDecorator => {
	return applyDecorators(UseGuards(AuthGuard));
};
