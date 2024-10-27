import { WalletBalance } from './wallet.interface';

export type SpotOrder = {
	price: number;
	quantity: number;
	type: 'buy' | 'sell';
	fee: number;
};

export type SpotTradingSnapshot = {
	currentPrice: number;
	datetime: Date;
	walletBalance: WalletBalance;
};

export type SpotGridBotState = {
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
