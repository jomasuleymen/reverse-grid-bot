import { Col, FormItemProps, Input, Row, Select } from 'antd'
import React from 'react'

import UpsertModalForm from '@/components/UpsertModalForm'
import { SERVICES } from '@/services'
import {
  CreateExchangeCredentials,
  ExchangeCredentialsType,
  ExchangeEnum,
} from '@/services/exchanges.service'
import { TRADING_BOT_CREDENTIALS_QUERY_KEY } from '.'

export type TCreateExchangeCredentialsForm = CreateExchangeCredentials

export const ExchangeCredentialsFormItems: (
  | FormItemProps<TCreateExchangeCredentialsForm>
  | FormItemProps<TCreateExchangeCredentialsForm>[]
)[] = [
  {
    label: 'Биржа',
    name: 'exchange',
    rules: [{ required: true }],
    required: true,
    children: (
      <Select allowClear>
        <Select.Option value={ExchangeEnum.Binance}>Binance</Select.Option>
        <Select.Option value={ExchangeEnum.Bybit}>Bybit</Select.Option>
      </Select>
    ),
  },
  [
    {
      label: 'Тип аккаунта',
      name: 'type',
      rules: [{ required: true }],
      required: true,
      children: (
        <Select allowClear>
          <Select.Option value={ExchangeCredentialsType.Testnet}>Тестовый режим</Select.Option>
          <Select.Option value={ExchangeCredentialsType.Real}>Реальный счет</Select.Option>
        </Select>
      ),
    },
    {
      label: 'Название аккаунта',
      name: 'name',
      rules: [{ required: true }],
      required: true,
      children: <Input />,
    },
  ],
  {
    label: 'Api key',
    name: 'apiKey',
    rules: [{ required: true }],
    required: true,
    children: <Input.Password />,
  },
  {
    label: 'Api secret',
    name: 'apiSecret',
    rules: [{ required: true }],
    required: true,
    children: <Input.Password />,
  },
]

interface TopBarProps {}

const onSubmit = async (data: TCreateExchangeCredentialsForm) => {
  return await SERVICES.EXCHANGE.CREDENTIALS.create(data)
}

const TopBar: React.FC<TopBarProps> = ({}) => {
  return (
    <Row align="middle" justify="space-between">
      <Col></Col>
      <Col>
        <UpsertModalForm
          buttonText="Добавить аккаунт"
          title="Добавить аккаунт"
          onSubmit={onSubmit}
          queryKey={TRADING_BOT_CREDENTIALS_QUERY_KEY}
          formItems={ExchangeCredentialsFormItems}
          parseError={(error: { message: string }) => {
            return error.message
          }}
        />
      </Col>
    </Row>
  )
}

export default TopBar
