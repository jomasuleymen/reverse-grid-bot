import { UserEntity } from './account/user.entity';
import { ExchangeCredentialsEntity } from './trading/exchang-credentials.entity';
import { KLineEntity } from './trading/kline';
import { TradingBotConfigEntity } from './trading/trading-config.entity';

export const ENTITIES = [
	KLineEntity,
	UserEntity,
	TradingBotConfigEntity,
	ExchangeCredentialsEntity,
];
