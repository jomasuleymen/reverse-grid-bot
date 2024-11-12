export type WalletBalance = {
	accountType: string;
	coins: Array<{
		coin: string;
		balance: number;
	}>;
};
