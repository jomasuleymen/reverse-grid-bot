import Block from '@/components/Block/Block'
import React from 'react'
import TradingBotsTable from './components/TradingBotsTable'

type Props = {}

const NonActiveTradingBots: React.FC<Props> = ({}) => {
  const queryKey = ['trading-bots', 'non-active']

  return (
    <Block title="Не активные" className="max-w-full">
      <TradingBotsTable queryKey={queryKey} />
    </Block>
  )
}

export default NonActiveTradingBots
