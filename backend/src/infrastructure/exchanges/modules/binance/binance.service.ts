import { WalletBalance } from '@/domain/interfaces/trading-bots/wallet.interface';
import { retryWithFallback } from '@/infrastructure/utils/request.utils';
import { Injectable } from '@nestjs/common';
import {
	MainClient,
	QueryCrossMarginAccountDetailsParams,
	SymbolPrice,
} from 'binance';
import { SECOND } from 'time-constants';

@Injectable()
export class BinanceService {
	private readonly restClient: MainClient;

	constructor() {
		this.restClient = new MainClient({
			recvWindow: 15 * SECOND,
		});
	}

	public async getTickerLastPrice(ticker: string): Promise<number> {
		const res = await retryWithFallback(
			() =>
				this.restClient.getSymbolPriceTicker({
					symbol: ticker,
				}),
			{
				attempts: 1,
				checkIfSuccess(res) {
					let isSuccess: boolean;

					if (Array.isArray(res)) {
						isSuccess = true;
					} else {
						isSuccess = !!res.price;
					}

					return {
						message: '',
						success: isSuccess,
						forceAbort: (res as any).code === -1121,
					};
				},
			},
		);

		if (!res.ok) {
			throw new Error(`Тикер ${ticker} не найден`);
		}

		return Number((res.data as SymbolPrice).price);
	}

	public formatWalletBalance(
		accountBalance: QueryCrossMarginAccountDetailsParams,
	): WalletBalance {
		return {
			accountType: (accountBalance as any).accountType || 'Unknown',
			coins: accountBalance.userAssets.map((coin) => ({
				coin: coin.asset,
				balance: Number(coin.free),
			})),
		};
	}
}
