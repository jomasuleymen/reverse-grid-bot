import { Col, FormItemProps, Input, Radio, Row } from 'antd'
import React from 'react'

import CustomInputNumber from '@/components/CustomInputNumber'
import UpsertModalForm from '@/components/UpsertModalForm'
import { SERVICES } from '@/services'
import { CreateTradingBotConfig, TradePosition } from '@/services/trading-bot.service'
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
  {
    label: 'Тейк-профит на сетке',
    name: 'takeProfitOnGrid',
    rules: [{ required: true }],
    required: true,
    children: <CustomInputNumber />,
  },
  {
    label: 'Позиция',
    name: 'position',
    rules: [{ required: true }],
    required: true,
    children: (
      <Radio.Group defaultValue="Pear" optionType="button">
        <Radio.Button value={TradePosition.LONG}>LONG</Radio.Button>
        <Radio.Button value={TradePosition.SHORT}>SHORT</Radio.Button>
      </Radio.Group>
    ),
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
