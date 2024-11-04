import DataTable from '@/components/DataTable'
import DeleteItemModal from '@/components/DeleteItemModal'
import { ColumnsType } from 'antd/es/table'
import React, { memo } from 'react'

import { SERVICES } from '@/services'
import { TradingBotConfig } from '@/services/trading-bot.service'
import { Space } from 'antd'

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
        {/* <UpsertModalForm
          buttonText="Изменить"
          title="Изменить компанию"
          onSubmit={(data: TCopmanyForm) => updateCompany(record._id, data)}
          queryKey={queryKey}
          formItems={CompanyFormItems}
          parseError={(error: { message: string }) => {
            return error.message
          }}
          update
          initialValues={record}
        /> */}
      </Space>
    ),
    align: 'center',
  },
]

interface Props {
  queryKey: string[]
}

const CompaniesTable: React.FC<Props> = ({ queryKey }) => {
  return (
    <DataTable
      key="Companies-table"
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

export default memo(CompaniesTable)
