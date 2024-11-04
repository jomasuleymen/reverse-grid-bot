import { Col, FormItemProps, Input, Row } from 'antd'
import React from 'react'

import CustomInputNumber from '@/components/CustomInputNumber'
import UpsertModalForm from '@/components/UpsertModalForm'
import { SERVICES } from '@/services'
import { CreateTradingBotConfig } from '@/services/trading-bot.service'

export type TCreateTradingBotConfigForm = CreateTradingBotConfig

export const BotConfigFormItems: FormItemProps<TCreateTradingBotConfigForm>[] = [
  {
    label: 'Тикер',
    name: 'symbol',
    rules: [{ required: true }],
    required: true,
    children: <Input />,
  },
  {
    label: 'Шаг сетки',
    name: 'gridStep',
    rules: [{ required: true }],
    required: true,
    children: <CustomInputNumber />,
  },
  {
    label: 'Объем сетки',
    name: 'gridVolume',
    rules: [{ required: true }],
    required: true,
    children: <CustomInputNumber />,
  },
  {
    label: 'Тейк-профит',
    name: 'takeProfit',
    rules: [{ required: true }],
    required: true,
    children: <CustomInputNumber />,
  },
]

interface TopBarProps {
  queryKey: string[]
}

const onSubmit = async (data: TCreateTradingBotConfigForm) => {
  return await SERVICES.TRADING_BOT.CONFIGS.create(data)
}

const TopBar: React.FC<TopBarProps> = ({ queryKey }) => {
  return (
    <Row align="middle" justify="space-between">
      <Col></Col>
      <Col>
        <UpsertModalForm
          buttonText="Добавить настройку"
          title="Добавить настройку"
          onSubmit={onSubmit}
          queryKey={queryKey}
          formItems={BotConfigFormItems}
          parseError={(error: { message: string }) => {
            return error.message
          }}
        />
      </Col>
    </Row>
  )
}

export default TopBar
