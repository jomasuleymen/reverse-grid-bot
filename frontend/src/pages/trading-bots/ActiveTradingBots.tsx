import Block from '@/components/Block/Block'
import React from 'react'
import { ACTIVE_TRADING_BOTS_QUERY_KEY } from '.'
import TradingBotsTable from './components/TradingBotsTable'

type Props = {}

const ActiveTradingBots: React.FC<Props> = ({}) => {
  return (
    <Block title="Активные" className="max-w-full">
      <TradingBotsTable queryKey={ACTIVE_TRADING_BOTS_QUERY_KEY} options={{ isActive: true }} />
    </Block>
  )
}

export default ActiveTradingBots
