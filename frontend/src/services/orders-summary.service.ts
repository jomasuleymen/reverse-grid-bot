import { TradingOrderSide } from './trading-bot.service'

export type ITradingOrderBase = {
  id: number
  feeCurrency: string
  avgPrice: number
  quantity: number
  side: TradingOrderSide
  fee: number
  createdDate: Date
  orderId?: number
  triggerPrice?: number
}

interface IPnlStatistics {
  maxPnl: number
  maxPnlIndex: number
  minPnl: number
  minPnlIndex: number
}

interface IPnl {
  fee: number
  unrealizedFees: number;
  totalProfit: number
  realizedPnl: number
  unrealizedPnl: number
  netPnl: number
}

export interface IPositionSummary {
  pnl: IPnl
  statistics: IPnlStatistics
  buyOrdersCount: number
  sellOrdersCount: number
  isMaxPnl?: boolean
  isMinPnl?: boolean
}

export type OrderWithSummaryBase = ITradingOrderBase & IPositionSummary

export type OrdersWithSummaryBase = IPositionSummary & {
  positions: OrderWithSummaryBase[]
}
