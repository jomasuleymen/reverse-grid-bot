import { TradingBotEntity } from '@/infrastructure/trading-bots/entities/trading-bots.entity';
import { ExchangeEnum, OrderSide } from '../exchanges/common.interface';
import { IProxy } from '../proxy.interface';
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
	triggerPrice?: number;
};

export type CreateTradingBotOrderBase = {
	customId: string;
	quantity: number;
	side: OrderSide;
	symbol: string;
};

export type CreateTradingBotImmediateOrder = CreateTradingBotOrderBase & {
	type: 'order';
};

export type CreateTradingBotStopOrder = CreateTradingBotOrderBase & {
	triggerPrice: number;
	type: 'stop-loss' | 'stop-order';
};

export type CreateTradingBotOrder =
	| CreateTradingBotImmediateOrder
	| CreateTradingBotStopOrder;

export type TradingBotSnapshot = {
	datetime: Date;
	walletBalance: WalletBalance;
};

export enum ExchangeCredentialsType {
	Testnet = 'Testnet',
	Real = 'Real',
}

export enum TradePosition {
	LONG = 1,
	SHORT = 2,
}

export interface ITradingBotConfig {
	baseCurrency: string;
	quoteCurrency: string;
	takeProfitOnGrid?: number;
	takeProfit?: number;
	triggerPrice?: number;
	gridStep: number;
	gridVolume: number;
	position: TradePosition;
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
	Stopped = 4,
	Stopping = 5,
	Errored = 6,
	WaitingForTriggerPrice = 7,
}

export interface IStartReverseBotOptions {
	config: ITradingBotConfig;
	credentials: IExchangeCredentials;
	proxy?: IProxy;
	callBacks: {
		getBotConfig: () => Promise<TradingBotEntity>;
		onNewOrder: (order: TradingBotOrder) => Promise<void>;

		onStateUpdate: (
			state: BotState,
			data?: {
				snapshots?: {
					start?: TradingBotSnapshot;
					end?: TradingBotSnapshot;
				};
				stoppedReason?: string;
			},
		) => Promise<void>;
	};
}

export interface ITradingBot {
	start(options: IStartReverseBotOptions): Promise<void>;
	stop(): Promise<void>;
}

export enum OrderCreationType {
	FIRST_TRADE = 1,
	TRIGGER = 2,
	STOP_LOSS = 3,
	LAST_TRADE = 4,
}
