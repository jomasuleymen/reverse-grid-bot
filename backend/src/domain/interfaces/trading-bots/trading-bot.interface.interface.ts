import { ExchangeEnum, OrderSide } from '../exchanges/common.interface';
import { WalletBalance } from './wallet.interface';

export type TradingBotOrder = {
	id: string;
	feeCurrency: string;
	customId: string;
	avgPrice: number;
	quantity: number;
	side: OrderSide;
	fee: number;
	symbol: string;
	createdDate: Date;
};

export type CreateTradingBotOrder = {
	customId: string;
	quantity: number;
	side: OrderSide;
	symbol: string;
} & (
	| {
			type: 'order';
	  }
	| {
			triggerPrice: number;
			type: 'stop-loss' | 'stop-order';
	  }
);

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
	takeProfitOnGrid: number;
	gridStep: number;
	gridVolume: number;
}

export interface IExchangeCredentials {
	id: number;
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
	botId: number;
	config: ITradingBotConfig;
	credentials: IExchangeCredentials;
	onStateUpdate: (newStatus: BotState) => void;
}

export interface ITradingBot {
	start(options: IStartReverseBotOptions): Promise<void>;
	stop(): Promise<void>;
}

export enum OrderCreationType {
	FIRST_BUY = 'FIRST_BUY',
	BUY_TRIGGER = 'BUY_TG',
	STOP_LOSS = 'SL',
	SELL_ALL = 'SELL_ALL',
}
