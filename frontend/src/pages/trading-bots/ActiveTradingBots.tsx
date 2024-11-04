import Block from '@/components/Block/Block'
import React from 'react'
import TradingBotsTable from './components/TradingBotsTable'

type Props = {}

const ActiveTradingBots: React.FC<Props> = ({}) => {
  const queryKey = ['trading-bots', 'active']

  return (
    <Block title="Активные" className="max-w-full">
      <TradingBotsTable queryKey={queryKey} />
    </Block>
  )
}

export default ActiveTradingBots
