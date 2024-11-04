import DataTable from '@/components/DataTable'
import DeleteItemModal from '@/components/DeleteItemModal'
import { ColumnsType } from 'antd/es/table'
import React, { memo } from 'react'

import UpsertModalForm from '@/components/UpsertModalForm'
import { SERVICES } from '@/services'
import { TradingBotConfig } from '@/services/trading-bot.service'
import { Space } from 'antd'
import { BotConfigFormItems, TCreateTradingBotConfigForm } from './BotConfigsTopBar'

type ColumnType = TradingBotConfig & {
  key: number
}

const parseDataSource = (data: TradingBotConfig[]): ColumnType[] => {
  if (!data) return []

  return data.map((item) => ({
    key: item.id,
    ...item,
  }))
}

const getColumns = (queryKey: string[]): ColumnsType<ColumnType> => [
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
          modalTitle={`Удалить настройку?`}
          onDelete={() => SERVICES.TRADING_BOT.CONFIGS.deleteOne(record.id)}
          invalidateQueryKey={queryKey}
        />
        <UpsertModalForm
          buttonText="Изменить"
          title="Изменить аккаунт"
          onSubmit={(data: TCreateTradingBotConfigForm) =>
            SERVICES.TRADING_BOT.CONFIGS.update(record.id, data)
          }
          queryKey={queryKey}
          formItems={BotConfigFormItems}
          parseError={(error: { message: string }) => {
            return error.message
          }}
          update
          initialValues={record}
        />
      </Space>
    ),
    align: 'center',
  },
]

interface Props {
  queryKey: string[]
}

const BotConfigsTable: React.FC<Props> = ({ queryKey }) => {
  return (
    <DataTable
      key="bot-configs-table"
      fetchData={SERVICES.TRADING_BOT.CONFIGS.fetchAll}
      queryKey={queryKey}
      parseDataSource={parseDataSource}
      columns={getColumns(queryKey)}
      tableProps={{
        style: {
          width: 'max-content',
          margin: '0 auto',
        },
      }}
    />
  )
}

export default memo(BotConfigsTable)
