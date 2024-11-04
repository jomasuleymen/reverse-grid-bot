import DataTable from '@/components/DataTable'
import DeleteItemModal from '@/components/DeleteItemModal'
import { ColumnsType } from 'antd/es/table'
import React, { memo } from 'react'

import { SERVICES } from '@/services'
import { ExchangeCredentials } from '@/services/exchanges.service'
import { Space } from 'antd'

type ColumnType = ExchangeCredentials & {
  key: number
}

const parseDataSource = (data: ExchangeCredentials[]): ColumnType[] => {
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
    title: 'Действия',
    key: 'action',
    render: (_, record: ColumnType) => (
      <Space>
        <DeleteItemModal
          modalTitle={`Удалить аккаунт ${record.exchange}(${record.type})?`}
          onDelete={() => SERVICES.EXCHANGE.CREDENTIALS.deleteOne(record.id)}
          invalidateQueryKey={queryKey}
        />
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
      fetchData={SERVICES.EXCHANGE.CREDENTIALS.fetchAll}
      queryKey={queryKey}
      parseDataSource={parseDataSource}
      columns={getColumns(queryKey)}
      tableProps={{
        // expandable: {
        //   expandedRowRender: (record: ColumnType) => getCompanyDetails(record),
        // },
        style: {
          width: 'max-content',
          margin: '0 auto',
        },
      }}
    />
  )
}

export default memo(CompaniesTable)
