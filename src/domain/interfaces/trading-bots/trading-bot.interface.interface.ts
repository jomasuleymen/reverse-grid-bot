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

export type GridBotState = {
	minPrice: number;
	maxPrice: number;
};

export type SpotReverseGridBotConfig = {
	tradingPair: string;
	baseOrderSize: number;
	orderIncrement: number;
	minOpenGridCount: number;
	takeProfitOnGrid?: number;
};

export enum BotState {
	Idle = 'idle',
	Initializing = 'initializing',
	Running = 'running',
	Stopping = 'stopping',
	Stopped = 'stopped',
}
