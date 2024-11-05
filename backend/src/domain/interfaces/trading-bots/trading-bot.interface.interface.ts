import { ExchangeEnum } from '../exchanges/common.interface';
import { WalletBalance } from './wallet.interface';

export type TradingBotOrder = {
	id: string | number;
	feeCurrency: string;
	customId: string;
	avgPrice: number;
	quantity: number;
	side: 'buy' | 'sell';
	fee: number;
	symbol: string;
};

export type CreateTradingBotOrder = {
	customId: string;
	price: number;
	quantity: number;
	type: 'order' | 'stop-loss' | 'stop-order';
	side: 'buy' | 'sell';
	symbol: string;
};

export type TradingBotSnapshot = {
	currentPrice: number;
	datetime: Date;
	walletBalance: WalletBalance;
};

export enum ExchangeCredentialsType {
	Testnet = 'Testnet',
	Real = 'Real',
}

export interface ITradingBotConfig {
	baseCurrency: string;
	quoteCurrency: string;
	symbol: string;
	takeProfit: number;
	gridStep: number;
	gridVolume: number;
}

export interface IExchangeCredentials {
	type: ExchangeCredentialsType;
	apiKey: string;
	apiSecret: string;
	exchange: ExchangeEnum;
}

export enum BotState {
	Idle = 1,
	Initializing = 2,
	Running = 3,
	Stopping = 4,
	Stopped = 5,
}

export interface IStartReverseBotOptions {
	userId: number;
	config: ITradingBotConfig;
	credentials: IExchangeCredentials;
	onStateUpdate: (newStatus: BotState) => void;
}

export interface ITradingBot {
	start(options: IStartReverseBotOptions): Promise<void>;
	stop(): Promise<void>;
}
