import { UserRepository } from './account/user.repo';
import { KLineRepository } from './trading/kline.repo';
import { BotConfigRepository } from './trading/trading-config.repo';

export const REPOSITORIES = [
	KLineRepository,
	UserRepository,
	BotConfigRepository,
];
