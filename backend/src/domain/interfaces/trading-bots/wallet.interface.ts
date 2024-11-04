export type WalletBalance = {
	accountType: string;
	balanceInUsd: number;
	coins: Array<{
		coin: string;
		balance: number;
		usdValue: number;
	}>;
};
