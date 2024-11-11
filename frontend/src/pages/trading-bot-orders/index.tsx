import ErrorDisplay from '@/components/ErrorDisplay'
import { SERVICES } from '@/services'
import { useQuery } from '@tanstack/react-query'
import { Space, Spin } from 'antd'
import React from 'react'
import { useParams } from 'react-router'
import TradingBotInfo from './TradingBotInfo'
import TradingBotOrdersTable from './TradingBotOrdersTable'

type Props = {}

const TradingBotOrders: React.FC<Props> = ({}) => {
  const { botId } = useParams()

  const { isPending, isSuccess, data, isError, error } = useQuery({
    queryKey: ['trading-bot', botId],
    queryFn: () => SERVICES.TRADING_BOT.fetchById(botId!),
    refetchOnWindowFocus: false,
  })

  return (
    <Spin tip="Загрузка..." spinning={isPending}>
      {!isPending && isSuccess && (
        <Space direction="vertical" style={{ display: 'flex' }} className="px-4">
          <TradingBotInfo bot={data} />
          <TradingBotOrdersTable
            botId={botId!}
            configs={{ baseCurrency: data.baseCurrency, quoteCurrency: data.quoteCurrency }}
          />
        </Space>
      )}
      {!isPending && isError && <ErrorDisplay className="mb-2" error={error as any} />}
    </Spin>
  )
}

export default TradingBotOrders
