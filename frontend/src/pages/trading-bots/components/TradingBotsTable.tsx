import ConfirmModal from '@/components/ConfirmModal'
import DataTable from '@/components/DataTable'
import { SERVICES } from '@/services'
import { ITradingBotFilter, TradingBot, TradingBotState } from '@/services/trading-bot.service'
import { Space } from 'antd'
import { ColumnsType } from 'antd/es/table'
import React from 'react'

type ColumnType = TradingBot & {
  key: number
}

type StateLabel = {
  label: string
  color: string
}

export function getBotStateLabel(state: TradingBotState): StateLabel {
  switch (state) {
    case TradingBotState.Idle:
      return { label: 'Ожидание', color: 'grey-500' }
    case TradingBotState.Initializing:
      return { label: 'Инициализация', color: 'blue-500' }
    case TradingBotState.Running:
      return { label: 'Запущен', color: 'green-500' }
    case TradingBotState.Stopping:
      return { label: 'Остановка', color: 'orange-500' }
    case TradingBotState.Stopped:
      return { label: 'Остановлен', color: 'red-500' }
    default:
      return { label: 'Неизвестное состояние', color: 'black' }
  }
}

const parseDataSource = (data: TradingBot[]): ColumnType[] => {
  if (!data) return []

  return data.map((item) => ({
    key: item.id,
    ...item,
  }))
}

const getColumns = (queryKey: string[]): ColumnsType<ColumnType> => [
  {
    title: 'Биржа',
    dataIndex: 'exchange',
    align: 'center',
  },
  {
    title: 'Тип аккаунта',
    dataIndex: 'type',
    align: 'center',
  },
  {
    title: 'Символ',
    align: 'center',
    render: (_, record) => {
      return <span>{record.baseCurrency + record.quoteCurrency}</span>
    },
  },
  {
    title: 'Шаг сетки',
    dataIndex: 'gridStep',
    align: 'center',
  },
  {
    title: 'Объем сетки',
    dataIndex: 'gridVolume',
    align: 'center',
  },
  {
    title: 'Тейк-профит',
    dataIndex: 'takeProfit',
    align: 'center',
  },
  {
    title: 'Время открытия',
    dataIndex: 'createdAt',
    align: 'center',
    render(value, record) {
      if (!value) return
      return <span>{new Date(value).toLocaleString('ru-Ru')}</span>
    },
  },
  {
    title: 'Время остановки',
    dataIndex: 'stoppedAt',
    align: 'center',
    render(value, record) {
      if (!value) return
      return <span>{new Date(value).toLocaleString('ru-Ru')}</span>
    },
  },
  {
    title: 'Статус',
    dataIndex: 'state',
    align: 'center',
    render: (_, record: ColumnType) => {
      const labelData = getBotStateLabel(record.state)

      return <span className={`text-${labelData.color}`}>{labelData.label}</span>
    },
  },
  {
    title: 'Действия',
    key: 'action',
    render: (_, record: ColumnType) => (
      <Space>
        {record.state === TradingBotState.Running && (
          <ConfirmModal
            modalTitle="Остановить бота?"
            onOk={() => SERVICES.TRADING_BOT.stopBot(record.id)}
            invalidateQueryKey={['trading-bots']}
            actionText="Остановить"
            cancelText="Отмена"
            okText="Остановить"
            okType="danger"
          />
        )}
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
  return (
    <DataTable
      fetchData={() => SERVICES.TRADING_BOT.fetchAll(options)}
      queryKey={queryKey}
      parseDataSource={parseDataSource}
      columns={getColumns(queryKey)}
    />
  )
}

export default TradingBotsTable
