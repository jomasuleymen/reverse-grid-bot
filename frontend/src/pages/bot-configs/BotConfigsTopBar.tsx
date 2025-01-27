import { Col, FormItemProps, Input, Row } from 'antd'
import React from 'react'

import CustomInputNumber from '@/components/CustomInputNumber'
import UpsertModalForm from '@/components/UpsertModalForm'
import { SERVICES } from '@/services'
import { CreateTradingBotConfig } from '@/services/trading-bot.service'
import { TRADING_BOT_CONFIGS_QUERY_KEY } from '.'

export type TCreateTradingBotConfigForm = CreateTradingBotConfig
type FormItemType = FormItemProps<TCreateTradingBotConfigForm>

export const BotConfigFormItems: (FormItemType | FormItemType[])[] = [
  [
    {
      label: 'Базовая валюта',
      name: 'baseCurrency',
      rules: [{ required: true }],
      required: true,
      children: <Input />,
    },
    {
      label: 'Котируемая валюта',
      name: 'quoteCurrency',
      rules: [{ required: true }],
      required: true,
      children: <Input />,
    },
  ],
  {
    label: 'Объем сетки (Базовая валюта)',
    name: 'gridVolume',
    rules: [{ required: true }],
    required: true,
    children: <CustomInputNumber />,
  },
  {
    label: 'Шаг сетки (Котируемая валюта)',
    name: 'gridStep',
    rules: [{ required: true }],
    required: true,
    children: <CustomInputNumber />,
  },
]

interface TopBarProps {}

const onSubmit = async (data: TCreateTradingBotConfigForm) => {
  return await SERVICES.TRADING_BOT.CONFIGS.create(data)
}

const TopBar: React.FC<TopBarProps> = ({}) => {
  return (
    <Row align="middle" justify="space-between">
      <Col></Col>
      <Col>
        <UpsertModalForm
          buttonText="Добавить настройку"
          title="Добавить настройку"
          onSubmit={onSubmit}
          queryKey={TRADING_BOT_CONFIGS_QUERY_KEY}
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
