import { Space } from 'antd'
import React from 'react'
import BotConfigsTable from './BotConfigsTable'
import BotConfigsTopBar from './BotConfigsTopBar'

export const TRADING_BOT_QUERY_KEY = ['trading-bot-configs']

const TradingBotConfigs: React.FC = () => {
  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <BotConfigsTopBar />
        <BotConfigsTable />
      </Space>
    </div>
  )
}

export default TradingBotConfigs
