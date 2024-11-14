import $api from '@/utils/http'

const EXCHANGES_ENDPOINT = '/exchanges'
const EXCHANGES_CREDENTIALS_ENDPOINT = EXCHANGES_ENDPOINT + '/credentials'

export enum ExchangeCredentialsType {
  Testnet = 'Testnet',
  Real = 'Real',
}

export enum ExchangeEnum {
  Binance = 'Binance',
  Bybit = 'Bybit',
}

export type ExchangeCredentials = {
  id: number
  name: string
  type: ExchangeCredentialsType
  exchange: ExchangeEnum
}

export type CreateExchangeCredentials = Omit<ExchangeCredentials, 'id'> & {
  apiKey: string
  apiSecret: string
}

const CREDENTIALS_API = {
  async fetchAll() {
    return await $api
      .get<ExchangeCredentials[]>(EXCHANGES_CREDENTIALS_ENDPOINT)
      .then((res) => res.data)
  },

  async deleteOne(id: number) {
    return await $api.delete(`${EXCHANGES_CREDENTIALS_ENDPOINT}/${id}`).then((res) => res.data)
  },

  async create(data: CreateExchangeCredentials) {
    return await $api.post(EXCHANGES_CREDENTIALS_ENDPOINT, data).then((res) => res.data)
  },
}

export const EXCHANGES_API = {
  CREDENTIALS: CREDENTIALS_API,
}
