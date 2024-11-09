import Block from '@/components/Block/Block'
import { Space } from 'antd'
import React from 'react'
import StartBotSimulatorModal from './components/StartBotSimulatorModal'
import TradingBotSimulatorsTable from './components/TradingBotSimulatorsTable'

type Props = {}

export const TRADING_BOT_SIMULATORS_QUERY_KEY = ['trading-bot-simulators']

const ActiveTradingBots: React.FC<Props> = ({}) => {
  return (
    <Block className="max-w-full">
      <Space direction="vertical" style={{ display: 'flex' }} className="px-4">
        <StartBotSimulatorModal />
        <TradingBotSimulatorsTable />
      </Space>
    </Block>
  )
}

export default ActiveTradingBots
