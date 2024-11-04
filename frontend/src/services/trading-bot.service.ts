import $api from '@/utils/http'

const TRADING_BOT_ENDPOINT = '/trading-bots'
const TRADING_BOT_CONFIGS_ENDPOINT = TRADING_BOT_ENDPOINT + '/configs'

export type TradingBotConfig = {
  id: number
  takeProfit: number
  gridStep: number
  gridVolume: number
  symbol: string
}

export type CreateTradingBotConfig = Omit<TradingBotConfig, 'id'>

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

export const TRADING_BOT_API = {
  CONFIGS: CONFIGS_API,
}
