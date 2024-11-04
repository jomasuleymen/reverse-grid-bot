import { IUser } from '../account/user.interface';
import { ExchangeEnum } from '../exchanges/common.interface';
import { WalletBalance } from './wallet.interface';

export type TraidingBotOrder = {
	price: number;
	quantity: number;
	type: 'buy' | 'sell';
	fee: number;
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
	takeProfit: number;
	gridStep: number;
	gridVolume: number;
	symbol: string;
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

export interface ITradingBot {
	start(
		config: ITradingBotConfig,
		credentials: IExchangeCredentials,
		user: IUser,
	): Promise<void>;
	stop(): Promise<void>;
}
