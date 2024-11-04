import DataTable from '@/components/DataTable'
import DeleteItemModal from '@/components/DeleteItemModal'
import { SERVICES } from '@/services'
import { TradingBot } from '@/services/trading-bot.service'
import { Space } from 'antd'
import { ColumnsType } from 'antd/es/table'
import React from 'react'

type ColumnType = TradingBot & {
  key: number
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
    title: 'Тикер',
    dataIndex: 'symbol',
    align: 'center',
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
    title: 'Действия',
    key: 'action',
    render: (_, record: ColumnType) => (
      <Space>
        <DeleteItemModal
          modalTitle={`Остановить бота?`}
          onDelete={() => SERVICES.TRADING_BOT.stopBot(record.id)}
          invalidateQueryKey={queryKey}
        />
      </Space>
    ),
    align: 'center',
  },
]

type Props = {
  options?: Parameters<typeof SERVICES.TRADING_BOT.fetchAll>
  queryKey: string[]
}

const TradingBotsTable: React.FC<Props> = ({ options, queryKey }) => {
  return (
    <DataTable
      fetchData={() => SERVICES.TRADING_BOT.fetchAll(options && options[0])}
      queryKey={queryKey}
      parseDataSource={parseDataSource}
      columns={getColumns(queryKey)}
    />
  )
}

export default TradingBotsTable
