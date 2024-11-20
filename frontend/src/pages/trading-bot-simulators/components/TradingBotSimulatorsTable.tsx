import DataTable from '@/components/DataTable'
import { SERVICES } from '@/services'
import { TradePosition } from '@/services/trading-bot.service'
import { TradingBotSimulator, TradingBotSimulatorStatus } from '@/services/trading-services.service'
import { formatDate } from '@/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Space, Tag, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { BaseType } from 'antd/es/typography/Base'
import React from 'react'
import { Link } from 'react-router-dom'
import { TRADING_BOT_SIMULATORS_QUERY_KEY } from '..'

const { Text } = Typography

type ColumnType = TradingBotSimulator & {
  key: number
}

type StateLabel = {
  label: string
  color: BaseType
}

export function parseSimulatorStatus(state: TradingBotSimulatorStatus): StateLabel {
  switch (state) {
    case TradingBotSimulatorStatus.Idle:
      return { label: 'Ожидание', color: 'secondary' }
    case TradingBotSimulatorStatus.InProgress:
      return { label: 'В процессе', color: 'warning' }
    case TradingBotSimulatorStatus.Completed:
      return { label: 'Завершено', color: 'success' }
    case TradingBotSimulatorStatus.Errored:
      return { label: 'Ошибка', color: 'danger' }
    default:
      return { label: 'Неизвестное состояние', color: 'secondary' }
  }
}

const parseDataSource = (data: TradingBotSimulator[]): ColumnType[] => {
  if (!data) return []

  return data.map((item) => ({
    key: item.id,
    ...item,
  }))
}

const getColumns = (): ColumnsType<ColumnType> => [
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
    render(value, record, index) {
      return `${value} ${record.quoteCurrency}`
    },
  },
  {
    title: 'Объем сетки',
    dataIndex: 'gridVolume',
    align: 'center',
    render(value, record, index) {
      return `${value} ${record.baseCurrency}`
    },
  },
  {
    title: 'Время начала',
    dataIndex: 'startTime',
    align: 'center',
    render(value) {
      if (!value) return
      return <span>{formatDate(value, { showTime: true })}</span>
    },
  },
  {
    title: 'Время окончания',
    dataIndex: 'endTime',
    align: 'center',
    render(value) {
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
    dataIndex: 'status',
    align: 'center',
    render: (_, record: ColumnType) => {
      const labelData = parseSimulatorStatus(record.status)

      return (
        <Text color="#00000" type={labelData.color} className={`text-${labelData.color}`}>
          {labelData.label}
        </Text>
      )
    },
  },
  {
    title: 'Действия',
    key: 'action',
    render: (_, record: ColumnType) => (
      <Space>
        {[TradingBotSimulatorStatus.Completed].includes(record.status) && (
          <Link className="text-blue-500" to={`${record.id}/orders`}>
            Детали
          </Link>
        )}
      </Space>
    ),
    align: 'center',
  },
]

const TradingBotSimulatorsTable: React.FC = () => {
  const queryClient = useQueryClient()

  return (
    <DataTable
      fetchData={() => SERVICES.TRADING_SERVICES.TRADING_BOT_SIMULATOR.fetchAll()}
      queryKey={TRADING_BOT_SIMULATORS_QUERY_KEY}
      parseDataSource={parseDataSource}
      columns={getColumns()}
      refetchOnWindowFocus={true}
      refetchInterval={2000}
      shouldRefetch={() => {
        const activeTradingBots =
          (queryClient.getQueryState(TRADING_BOT_SIMULATORS_QUERY_KEY)?.data as Array<any>) || []

        const data = activeTradingBots.slice(0, 5)

        return (
          data.findIndex(
            (bot) =>
              bot.status === TradingBotSimulatorStatus.Idle ||
              bot.status === TradingBotSimulatorStatus.InProgress,
          ) !== -1
        )
      }}
    />
  )
}

export default TradingBotSimulatorsTable
