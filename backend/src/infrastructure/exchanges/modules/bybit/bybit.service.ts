import { WalletBalance } from '@/domain/interfaces/trading-bots/wallet.interface';
import { Injectable } from '@nestjs/common';
import { CategoryV5, RestClientV5, WalletBalanceV5 } from 'bybit-api';
import { SECOND } from 'time-constants';

@Injectable()
export class BybitService {
	private restClient: RestClientV5;

	constructor() {
		this.restClient = new RestClientV5({
			parseAPIRateLimits: true,
			recv_window: 15 * SECOND,
		});
	}

	public async getTickerLastPrice(
		category: 'spot' | CategoryV5,
		ticker: string,
	): Promise<number> {
		const coinPriceRes = await this.restClient.getTickers({
			category: category as any,
			symbol: ticker,
		});

		const foundTicker = coinPriceRes.result?.list?.find?.(
			(value) => value.symbol === ticker,
		);

		if (!foundTicker) {
			throw new Error(`Тикер ${ticker} не найден`);
		}
		return Number(foundTicker.lastPrice);
	}

	public formatWalletBalance(accountBalance: WalletBalanceV5): WalletBalance {
		return {
			accountType: accountBalance.accountType,
			coins: accountBalance.coin.map((coin: any) => ({
				coin: coin.coin,
				balance: Number(coin.walletBalance),
			})),
		};
	}
}
