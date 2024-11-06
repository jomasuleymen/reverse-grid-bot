import $api from '@/utils/http'
import { ExchangeCredentials } from './exchanges.service'

const TRADING_BOT_ENDPOINT = '/trading-bots'
const TRADING_BOT_CONFIGS_ENDPOINT = TRADING_BOT_ENDPOINT + '-configs'
const TRADING_BOT_ORDERS_ENDPOINT = TRADING_BOT_ENDPOINT + '/orders'

export type TradingBotConfig = {
  id: number
  takeProfitOnGrid: number
  gridStep: number
  gridVolume: number
  baseCurrency: string
  quoteCurrency: string
  createdAt: string
  stoppedAt: string
}

export enum TradingBotState {
  Idle = 1,
  Initializing = 2,
  Running = 3,
  Stopping = 4,
  Stopped = 5,
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

const ORDERS_API = {
  async fetchByBotId(botId: string | number) {
    return await $api
      .get<TradingBotOrder[]>(TRADING_BOT_ORDERS_ENDPOINT + '/' + botId)
      .then((res) => res.data)
  },
}

export interface ITradingBotFilter {
  isActive?: boolean
}

export interface IStartBotOptions {
  credentialsId: number
  configId: number
}

export interface IBotSummary {
  pnl: {
    realizedPnL: number
    unrealizedPnL: number
    PnL: number
    maxProfit: number
    maxLoss: number
  }
  buyCount: number
  sellCount: number
  sumComission: number
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

  async getBotSummary(botId: number | string) {
    return await $api
      .get<IBotSummary>(`${TRADING_BOT_ENDPOINT}/${botId}/summary`)
      .then((res) => res.data)
  },

  async startBot(options: IStartBotOptions) {
    return await $api.post<any>(`${TRADING_BOT_ENDPOINT}/start`, options).then((res) => res.data)
  },

  async stopBot(botId: number) {
    return await $api.post<any>(`${TRADING_BOT_ENDPOINT}/stop`, { botId }).then((res) => res.data)
  },
}
