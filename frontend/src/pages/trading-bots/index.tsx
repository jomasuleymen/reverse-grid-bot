import { Space } from 'antd'
import React from 'react'
import ActiveTradingBots from './ActiveTradingBots'
import NonActiveTradingBots from './NonActiveTradingBots'
import StartBotModal from './components/StartBotModal'

type Props = {}

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
