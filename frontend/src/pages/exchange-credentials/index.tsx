import { Space } from 'antd'
import React from 'react'
import CredentialsTable from './CredentialsTable'
import CredentialsTopBar from './CredentialsTopBar'

export const TRADING_BOT_CREDENTIALS_QUERY_KEY = ['trading-bot-credentials']

const TradingBotCredentials: React.FC = () => {
  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <CredentialsTopBar />
        <CredentialsTable />
      </Space>
    </div>
  )
}

export default TradingBotCredentials
