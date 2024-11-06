import { SERVICES } from '@/services'
import { useQuery } from '@tanstack/react-query'
import { Alert, message, Space, Spin } from 'antd'
import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import TradingBotOrdersInfo from './TradingBotOrdersInfo'
import TradingBotOrdersTable from './TradingBotOrdersTable'

type Props = {}

const TradingBotOrders: React.FC<Props> = ({}) => {
  const { botId } = useParams()

  const { isPending, isSuccess, data, isError, error } = useQuery({
    queryKey: ['trading-bot', botId],
    queryFn: () => SERVICES.TRADING_BOT.fetchById(botId!),
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (isError && error) {
      message.error(error.message)
    }
  }, [error, isError])

  return (
    <Spin tip="Загрузка..." spinning={isPending}>
      {!isPending && isSuccess && (
        <Space direction="vertical" style={{ display: 'flex' }} className="px-4">
          <TradingBotOrdersInfo bot={data} />
          <TradingBotOrdersTable
            botId={botId!}
            configs={{ baseCurrency: data.baseCurrency, quoteCurrency: data.quoteCurrency }}
          />
        </Space>
      )}
      {!isPending && isError && <Alert message={error.message} type="error" />}
    </Spin>
  )
}

export default TradingBotOrders
