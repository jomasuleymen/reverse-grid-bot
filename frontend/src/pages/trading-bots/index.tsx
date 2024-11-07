import { Space } from 'antd'
import React from 'react'
import ActiveTradingBots from './ActiveTradingBots'
import NonActiveTradingBots from './NonActiveTradingBots'
import StartBotModal from './components/StartBotModal'

type Props = {}

export const TRADING_BOTS_QUERY_KEY = ['trading-bots']
export const ACTIVE_TRADING_BOTS_QUERY_KEY = [...TRADING_BOTS_QUERY_KEY, 'active']
export const NON_ACTIVE_TRADING_BOTS_QUERY_KEY = [...TRADING_BOTS_QUERY_KEY, 'non-active']

const TradingBots: React.FC<Props> = ({}) => {
  return (
    <Space direction="vertical" style={{ display: 'flex' }} className="px-4">
      <StartBotModal />
      <ActiveTradingBots />
      <NonActiveTradingBots />
    </Space>
  )
}

export default TradingBots
