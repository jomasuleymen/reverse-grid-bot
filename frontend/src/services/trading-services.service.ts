import $api from '@/utils/http'

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
  startTime: number
  endTime: number
  status: TradingBotSimulatorStatus
  result: TradingBotSimulatorResult
  createdAt: Date
}

export type TradingBotSimulatorResult = {
  id: number
  buyCount: number
  sellCount: number
  openPrice: number
  closePrice: number
  highestPrice: number
  lowestPrice: number
  totalProfit: number
  totalFee: number
  realizedPnL: number
  unrealizedPnL: number
  PnL: number
  maxPnL: number
  createdAt: Date
}

export type CreateTradingBotSimulator = Omit<
  TradingBotSimulator,
  'id' | 'status' | 'result' | 'createdAt'
>

const TRADING_BOT_SIMULATORS_API = {
  async fetchAll() {
    return await $api
      .get<TradingBotSimulator[]>(TRADING_SERVICES_ENDPOINT + '/reverse-grid-bot-simulator')
      .then((res) => res.data)
  },

  async create(data: CreateTradingBotSimulator) {
    return await $api
      .post(TRADING_SERVICES_ENDPOINT + '/reverse-grid-bot-simulator', data)
      .then((res) => res.data)
  },
}

export const TRADING_SERVICES_API = {
  TRADING_BOT_SIMULATOR: TRADING_BOT_SIMULATORS_API,
}
