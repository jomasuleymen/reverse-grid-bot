import { TelegramAccountRepository } from './account/telegram-account.repo';
import { UserRepository } from './account/user.repo';
import { ExchangeCredentialsRepository } from './trading/exchange-credentials.repo';
import { KLineRepository } from './trading/kline.repo';
import { BotConfigRepository } from './trading/trading-config.repo';

export const REPOSITORIES = [
	KLineRepository,
	UserRepository,
	BotConfigRepository,
	ExchangeCredentialsRepository,
	TelegramAccountRepository,
];
