import ConfirmModal from '@/components/ConfirmModal'
import DataTable from '@/components/DataTable'
import { SERVICES } from '@/services'
import {
  ITradingBotFilter,
  TradePosition,
  TradingBot,
  TradingBotState,
} from '@/services/trading-bot.service'
import { formatDate } from '@/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Space, Tag, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { BaseType } from 'antd/es/typography/Base'
import React from 'react'
import { Link } from 'react-router-dom'
import {
  ACTIVE_TRADING_BOTS_QUERY_KEY,
  NON_ACTIVE_TRADING_BOTS_QUERY_KEY,
  TRADING_BOTS_QUERY_KEY,
} from '..'

const { Text, Link: LinkStyle } = Typography

type ColumnType = TradingBot & {
  key: number
}

type StateLabel = {
  label: string
  color: BaseType
}

export function getBotStateLabel(state: TradingBotState): StateLabel {
  switch (state) {
    case TradingBotState.Idle:
      return { label: 'Ожидание', color: 'secondary' }
    case TradingBotState.Initializing:
      return { label: 'Инициализация', color: 'secondary' }
    case TradingBotState.Running:
      return { label: 'Запущен', color: 'success' }
    case TradingBotState.Stopping:
      return { label: 'Остановка', color: 'warning' }
    case TradingBotState.Stopped:
      return { label: 'Остановлено', color: 'warning' }
    case TradingBotState.Errored:
      return { label: 'Ошибка', color: 'danger' }
    default:
      return { label: 'Неизвестное состояние', color: 'secondary' }
  }
}

const parseDataSource = (data: TradingBot[]): ColumnType[] => {
  if (!data) return []

  return data.map((item) => ({
    key: item.id,
    ...item,
  }))
}

const getColumns = (options: Props['options']): ColumnsType<ColumnType> => [
  {
    title: 'Аккаунт',
    dataIndex: 'exchange',
    align: 'center',
    render(value, record, index) {
      return (
        <span>
          {value} ({record.type})
        </span>
      )
    },
  },
  {
    title: 'Символ',
    align: 'center',
    dataIndex: 'baseCurrency',
    render: (_, record) => {
      return <span>{record.baseCurrency + record.quoteCurrency}</span>
    },
  },
  {
    title: 'Шаг сетки',
    dataIndex: 'gridStep',
    align: 'center',
    width: '90px',
  },
  {
    title: 'Объем сетки',
    dataIndex: 'gridVolume',
    align: 'center',
    width: '90px',
  },
  {
    title: 'Тейк-профит',
    align: 'center',
    render: (value, record) => {
      return (
        <div>
          <span>{record.takeProfitOnGrid} - сетка</span>
          {record.takeProfit && (
            <>
              <br />
              <span> {record.takeProfit + ' ' + record.quoteCurrency}</span>
            </>
          )}
        </div>
      )
    },
  },
  {
    title: 'Время открытия',
    dataIndex: 'createdAt',
    align: 'center',
    render(value, record) {
      if (!value) return
      return <span>{formatDate(value, { showTime: true })}</span>
    },
  },
  {
    title: 'Время остановки',
    dataIndex: 'stoppedAt',
    align: 'center',
    render(value, record) {
      if (!value) return
      return <span>{formatDate(value, { showTime: true })}</span>
    },
  },
  {
    title: 'Позиция',
    dataIndex: 'position',
    align: 'center',
    render(value) {
      if (!value) return
      return (
        <Tag color={value === TradePosition.LONG ? 'green' : 'red'}>
          {value === TradePosition.LONG ? 'LONG' : 'SHORT'}
        </Tag>
      )
    },
  },
  {
    title: 'Статус',
    dataIndex: 'state',
    align: 'center',
    render: (_, record: ColumnType) => {
      const labelData = getBotStateLabel(record.state)

      return (
        <Text color="#00000" type={labelData.color} className={`text-${labelData.color}`}>
          {labelData.label}
        </Text>
      )
    },
  },
  {
    title: 'Причина остановки',
    dataIndex: 'state',
    hidden: options?.isActive,
    align: 'center',
    width: '60px',
    render: (_, record: ColumnType) => {
      return <span>{record.stopReason && `(${record.stopReason})`}</span>
    },
  },
  {
    title: 'Действия',
    key: 'action',
    render: (_, record: ColumnType) => (
      <Space>
        {[TradingBotState.Running].includes(record.state) && (
          <ConfirmModal
            modalTitle="Остановить бота?"
            onOk={() => SERVICES.TRADING_BOT.stopBot(record.id)}
            invalidateQueryKey={TRADING_BOTS_QUERY_KEY}
            actionText="Остановить"
            cancelText="Отмена"
            okText="Остановить"
            okType="danger"
          />
        )}
        <Link className="text-blue-500" to={`${record.id}/orders`}>
          Детали
        </Link>
      </Space>
    ),
    align: 'center',
  },
]

type Props = {
  options?: ITradingBotFilter
  queryKey: string[]
}

const TradingBotsTable: React.FC<Props> = ({ options, queryKey }) => {
  const queryClient = useQueryClient()

  return (
    <DataTable
      fetchData={() => SERVICES.TRADING_BOT.fetchAll(options)}
      queryKey={queryKey}
      parseDataSource={parseDataSource}
      columns={getColumns(options)}
      refetchOnWindowFocus={true}
      refetchInterval={2000}
      shouldRefetch={() => {
        const activeTradingBots =
          (queryClient.getQueryState(ACTIVE_TRADING_BOTS_QUERY_KEY)?.data as Array<any>) || []
        const nonActiveTradingBots =
          (queryClient.getQueryState(NON_ACTIVE_TRADING_BOTS_QUERY_KEY)?.data as Array<any>) || []

        const data = [...activeTradingBots, ...nonActiveTradingBots.slice(0, 5)]

        return (
          data.findIndex(
            (bot) =>
              bot.state === TradingBotState.Initializing || bot.state === TradingBotState.Stopping,
          ) !== -1
        )
      }}
    />
  )
}

export default TradingBotsTable
