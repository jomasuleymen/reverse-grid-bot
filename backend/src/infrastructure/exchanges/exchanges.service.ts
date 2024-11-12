import { WalletBalance } from '@/domain/interfaces/trading-bots/wallet.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExchangesService {
	public emptyWalletBalance(): WalletBalance {
		return {
			accountType: 'Неизвестный',
			coins: [],
		};
	}
}
