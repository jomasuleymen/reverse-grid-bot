import Block from '@/components/Block/Block'
import React from 'react'
import TradingBotsTable from './components/TradingBotsTable'

type Props = {}

const NonActiveTradingBots: React.FC<Props> = ({}) => {
  const queryKey = ['trading-bots', 'non-active']

  return (
    <Block title="История" className="max-w-full">
      <TradingBotsTable queryKey={queryKey} options={{ isActive: false }} />
    </Block>
  )
}

export default NonActiveTradingBots
