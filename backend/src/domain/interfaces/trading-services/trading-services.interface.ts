import { OrderSide } from '../exchanges/common.interface';

export enum TradingBotSimulatorStatus {
	Idle = 1,
	InProgress = 2,
	Completed = 3,
	Errored = 4,
}

export interface IBotSimulatorOrder {
	feeCurrency: string;
	avgPrice: number;
	triggerPrice: number;
	quantity: number;
	side: OrderSide;
	fee: number;
	createdDate: Date;
}
