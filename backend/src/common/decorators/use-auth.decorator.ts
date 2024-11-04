import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';

export const UseAuthorized = () => {
	return applyDecorators(UseGuards(AuthGuard));
};
