import ErrorDisplay from '@/components/ErrorDisplay'
import TradingBotOrdersTable from '@/components/trading-bot/TradingBotOrdersTable'
import { SERVICES } from '@/services'
import { useQuery } from '@tanstack/react-query'
import { Space, Spin } from 'antd'
import React, { memo } from 'react'
import { useParams } from 'react-router'
import TradingBotInfo from './TradingBotInfo'

const SimulatorBotOrdersPage: React.FC = () => {
  const { botId } = useParams()

  const { isPending, isSuccess, data, isError, error } = useQuery({
    queryKey: ['trading-simulator-bot-with-summaries', botId],
    queryFn: async () => {
      const [bot, orders] = await Promise.all([
        SERVICES.TRADING_SERVICES.TRADING_BOT_SIMULATOR.fetchById(botId!),
        SERVICES.TRADING_SERVICES.TRADING_BOT_SIMULATOR.fetchOrdersSummaryById(botId!),
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
            hiddenColumns={{
              orderId: true,
            }}
          />
        </Space>
      )}
      {!isPending && isError && <ErrorDisplay className="mb-2" error={error as any} />}
    </Spin>
  )
}

export default memo(SimulatorBotOrdersPage)
