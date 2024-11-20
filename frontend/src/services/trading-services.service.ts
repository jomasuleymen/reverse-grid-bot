import $api from '@/utils/http'
import { IPositionSummary } from './orders-summary.service'
import { TradePosition, TradingOrderSide } from './trading-bot.service'

const TRADING_SERVICES_ENDPOINT = '/trading-services'

export enum TradingBotSimulatorStatus {
  Idle = 1,
  InProgress = 2,
  Completed = 3,
  Errored = 4,
}

export type TradingBotSimulator = {
  id: number
  baseCurrency: string
  quoteCurrency: string
  gridStep: number
  gridVolume: number
  position: TradePosition
  startTime: number
  endTime: number
  status: TradingBotSimulatorStatus
  stats: TradingBotSimulatorStats
  orders: TradingBotSimulatorOrder[]
  createdAt: Date
}

export type TradingBotSimulatorStats = {
  id: number
  openPrice: number
  closePrice: number
  highestPrice: number
  lowestPrice: number
  createdAt: Date
}

export type TradingBotSimulatorOrder = {
  id: number
  feeCurrency: string
  avgPrice: number
  triggerPrice: number
  quantity: number
  side: TradingOrderSide
  fee: number
  createdDate: Date
}

export type CreateTradingBotSimulator = Omit<
  TradingBotSimulator,
  'id' | 'status' | 'result' | 'createdAt'
>

export type SimulatorOrderWithSummary = TradingBotSimulatorOrder & IPositionSummary

export type SimulatorOrdersWithSummary = IPositionSummary & {
  positions: SimulatorOrderWithSummary[]
}

const TRADING_BOT_SIMULATORS_API = {
  endPoint: TRADING_SERVICES_ENDPOINT + '/reverse-grid-bot-simulators',

  async fetchAll() {
    return await $api.get<TradingBotSimulator[]>(this.endPoint).then((res) => res.data)
  },

  async fetchById(id: number | string) {
    return await $api.get<TradingBotSimulator>(`${this.endPoint}/${id}`).then((res) => res.data)
  },

  async fetchOrdersSummaryById(id: number | string) {
    return await $api
      .get<SimulatorOrdersWithSummary>(`${this.endPoint}/${id}/orders-summary`)
      .then((res) => res.data)
  },

  async create(data: CreateTradingBotSimulator) {
    return await $api.post(this.endPoint, data).then((res) => res.data)
  },
}

export const TRADING_SERVICES_API = {
  TRADING_BOT_SIMULATOR: TRADING_BOT_SIMULATORS_API,
}
