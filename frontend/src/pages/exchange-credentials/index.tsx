import { Space } from 'antd'
import React from 'react'
import CredentialsTable from './CredentialsTable'
import CredentialsTopBar from './CredentialsTopBar'

const TradingBotCredentials: React.FC = () => {
  const queryKey = ['trading-bot-credentials']

  return (
    <div className="paper">
      <Space direction="vertical" style={{ width: '100%' }}>
        <CredentialsTopBar queryKey={queryKey} />
        <CredentialsTable queryKey={queryKey} />
      </Space>
    </div>
  )
}

export default TradingBotCredentials
