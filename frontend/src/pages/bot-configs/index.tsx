import { Space } from 'antd'
import React from 'react'
import BotConfigsTable from './BotConfigsTable'
import BotConfigsTopBar from './BotConfigsTopBar'

const TradingBotConfigs: React.FC = () => {
  const queryKey = ['trading-bot-configs']

  return (
    <div className="paper">
      <Space direction="vertical" style={{ width: '100%' }}>
        <BotConfigsTopBar queryKey={queryKey} />
        <BotConfigsTable queryKey={queryKey} />
      </Space>
    </div>
  )
}

export default TradingBotConfigs
