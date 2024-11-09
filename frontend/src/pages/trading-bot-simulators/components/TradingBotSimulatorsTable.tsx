import DataTable from '@/components/DataTable'
import { SERVICES } from '@/services'
import { TradingBotSimulator, TradingBotSimulatorStatus } from '@/services/trading-services.service'
import { formatDate } from '@/utils'
import { Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { BaseType } from 'antd/es/typography/Base'
import React from 'react'
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
]

type Props = {}

function getExpandDetails(record: TradingBotSimulator) {
  const data = {
    ID: record.id,
    'Базовая валюта': record.baseCurrency,
    'Котируемая валюта': record.quoteCurrency,
    'Шаг сетки': record.gridStep,
    'Объем сетки': record.gridVolume,
    'Время начала': new Date(record.startTime).toLocaleString(),
    'Время окончания': new Date(record.endTime).toLocaleString(),
    Статус: record.status,
    'Результат - Количество покупок': record.result.buyCount,
    'Результат - Количество продаж': record.result.sellCount,
    'Результат - Цена открытия': record.result.openPrice,
    'Результат - Цена закрытия': record.result.closePrice,
    'Результат - Наивысшая цена': record.result.highestPrice,
    'Результат - Наименьшая цена': record.result.lowestPrice,
    'Результат - Общая прибыль': record.result.totalProfit,
    'Результат - Общая комиссия': record.result.totalFee,
    'Результат - Реализованный PnL': record.result.realizedPnL,
    'Результат - Нереализованный PnL': record.result.unrealizedPnL,
    'Результат - PnL': record.result.PnL,
    'Результат - Максимальный PnL': record.result.maxPnL,
    'Дата создания': record.createdAt.toLocaleString(),
  }

  return Object.entries(data).map(([key, value]) => (
    <div key={key}>
      <b>{key}:</b> {value}
    </div>
  ))
}

const TradingBotSimulatorsTable: React.FC<Props> = () => {
  return (
    <DataTable
      fetchData={() => SERVICES.TRADING_SERVICES.TRADING_BOT_SIMULATOR.fetchAll()}
      queryKey={TRADING_BOT_SIMULATORS_QUERY_KEY}
      parseDataSource={parseDataSource}
      columns={getColumns()}
      tableProps={{
        expandable: {
          expandedRowRender: (record) => getExpandDetails(record),
          rowExpandable: (record) => {
            return !!record.result
          },
        },
      }}
      refetchOnWindowFocus={true}
    />
  )
}

export default TradingBotSimulatorsTable
