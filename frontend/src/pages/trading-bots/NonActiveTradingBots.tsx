import Block from '@/components/Block/Block'
import React from 'react'
import { NON_ACTIVE_TRADING_BOTS_QUERY_KEY } from '.'
import TradingBotsTable from './components/TradingBotsTable'

type Props = {}

const NonActiveTradingBots: React.FC<Props> = ({}) => {
  return (
    <Block title="История" className="max-w-full">
      <TradingBotsTable
        queryKey={NON_ACTIVE_TRADING_BOTS_QUERY_KEY}
        options={{ isActive: false }}
      />
    </Block>
  )
}

export default NonActiveTradingBots
