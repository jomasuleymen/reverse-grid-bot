import $api from '@/utils/http'
import { ExchangeCredentials } from './exchanges.service'

const TRADING_BOT_ENDPOINT = '/trading-bots'
const TRADING_BOT_CONFIGS_ENDPOINT = TRADING_BOT_ENDPOINT + '-configs'
const TRADING_BOT_ORDERS_ENDPOINT = TRADING_BOT_ENDPOINT + '/orders'

export enum TradePosition {
  LONG = 1,
  SHORT = 2,
}

export type TradingBotConfig = {
  id: number
  gridStep: number
  gridVolume: number
  baseCurrency: string
  quoteCurrency: string
  createdAt: string
  stoppedAt: string
  position: TradePosition
  stopReason?: string
  takeProfitOnGrid?: number
  takeProfit?: number
  triggerPrice?: number
  tradeOnStart?: boolean
}

export enum TradingBotState {
  Idle = 1,
  Initializing = 2,
  Running = 3,
  Stopped = 4,
  Stopping = 5,
  Errored = 6,
  WaitingForTriggerPrice = 7,
}

export type TradingBot = {
  id: number
  state: TradingBotState
} & Omit<TradingBotConfig, 'id'> &
  Omit<ExchangeCredentials, 'id'>

export type CreateTradingBotConfig = Omit<TradingBotConfig, 'id'>

export enum TradingOrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export type TradingBotOrder = {
  id: number
  orderId: number
  feeCurrency: string
  customId: string
  avgPrice: number
  triggerPrice: number
  quantity: number
  side: TradingOrderSide
  fee: number
  symbol: string
  createdDate: Date
  botId: number
}

const CONFIGS_API = {
  async fetchAll() {
    return await $api.get<TradingBotConfig[]>(TRADING_BOT_CONFIGS_ENDPOINT).then((res) => res.data)
  },

  async deleteOne(id: number) {
    return await $api.delete(`${TRADING_BOT_CONFIGS_ENDPOINT}/${id}`).then((res) => res.data)
  },

  async update(id: number, data: CreateTradingBotConfig) {
    return await $api.put(`${TRADING_BOT_CONFIGS_ENDPOINT}/${id}`, data).then((res) => res.data)
  },

  async create(data: CreateTradingBotConfig) {
    return await $api.post(TRADING_BOT_CONFIGS_ENDPOINT, data).then((res) => res.data)
  },
}

export interface ITradingBotFilter {
  isActive?: boolean
}

export interface IStartBotOptions {
  credentialsId: number
  configId: number
}

interface IPnl {
  fee: number
  totalProfit: number
  realizedPnl: number
  unrealizedPnl: number
  netPnl: number
}

interface IStatistics {
  maxPnl: number
  minPnl: number
}

interface IPositionSummary {
  pnl: IPnl
  statistics: IStatistics
  buyOrdersCount: number
  sellOrdersCount: number
  isMaxPnl?: boolean
  isMinPnl?: boolean
}

export type OrderWithSummary = TradingBotOrder & IPositionSummary

export type OrdersWithSummary = IPositionSummary & {
  positions: OrderWithSummary[]
}

const ORDERS_API = {
  async fetchByBotId(botId: string | number) {
    return await $api
      .get<TradingBotOrder[]>(TRADING_BOT_ORDERS_ENDPOINT + '/' + botId)
      .then((res) => res.data)
  },

  async getOrdersWithSummary(botId: number | string) {
    return await $api
      .get<OrdersWithSummary>(`${TRADING_BOT_ORDERS_ENDPOINT}/${botId}/summary`)
      .then((res) => res.data)
  },
}

export const TRADING_BOT_API = {
  CONFIGS: CONFIGS_API,
  ORDERS: ORDERS_API,

  async fetchAll(filter?: ITradingBotFilter) {
    return await $api
      .get<TradingBot[]>(TRADING_BOT_ENDPOINT, { params: filter })
      .then((res) => res.data)
  },

  async fetchById(botId: number | string) {
    return await $api.get<TradingBot>(`${TRADING_BOT_ENDPOINT}/${botId}`).then((res) => res.data)
  },

  async editBot(botId: string | number, data: Partial<TradingBotConfig>) {
    return await $api.put<any>(`${TRADING_BOT_ENDPOINT}/${botId}`, data).then((res) => res.data)
  },

  async startBot(options: IStartBotOptions) {
    return await $api.post<any>(`${TRADING_BOT_ENDPOINT}/start`, options).then((res) => res.data)
  },

  async stopBot(botId: number) {
    return await $api.post<any>(`${TRADING_BOT_ENDPOINT}/stop`, { botId }).then((res) => res.data)
  },
}
