import ErrorDisplay from '@/components/ErrorDisplay'
import { SERVICES } from '@/services'
import { useQuery } from '@tanstack/react-query'
import { Space, Spin } from 'antd'
import React, { memo } from 'react'
import { useParams } from 'react-router'
import TradingBotOrdersTable from '../../components/trading-bot/TradingBotOrdersTable'
import TradingBotInfo from './TradingBotInfo'

type Props = {}

const TradingBotOrdersPage: React.FC<Props> = ({}) => {
  const { botId } = useParams()

  const { isPending, isSuccess, data, isError, error } = useQuery({
    queryKey: ['trading-bot-with-summaries', botId],
    queryFn: async () => {
      const [bot, orders] = await Promise.all([
        SERVICES.TRADING_BOT.fetchById(botId!),
        SERVICES.TRADING_BOT.ORDERS.getOrdersWithSummary(botId!),
      ])
      return { bot, orders }
    },
    refetchOnWindowFocus: false,
  })

  const { bot, orders } = data || {}

  return (
    <Spin tip="Загрузка..." spinning={isPending}>
      {!isPending && isSuccess && bot && orders && (
        <Space direction="vertical" style={{ display: 'flex' }} className="px-4">
          <TradingBotInfo bot={bot} />
          <TradingBotOrdersTable
            configs={{ baseCurrency: bot.baseCurrency, quoteCurrency: bot.quoteCurrency }}
            data={orders}
            isPending={isPending}
            isSuccess={isSuccess}
          />
        </Space>
      )}
      {!isPending && isError && <ErrorDisplay className="mb-2" error={error as any} />}
    </Spin>
  )
}

export default memo(TradingBotOrdersPage)
