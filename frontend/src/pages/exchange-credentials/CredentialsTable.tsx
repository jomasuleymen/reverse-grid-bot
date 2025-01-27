import ConfirmModal from '@/components/ConfirmModal'
import DataTable from '@/components/DataTable'
import { ColumnsType } from 'antd/es/table'
import React, { memo } from 'react'

import { SERVICES } from '@/services'
import { ExchangeCredentials } from '@/services/exchanges.service'
import { Space } from 'antd'
import { TRADING_BOT_CREDENTIALS_QUERY_KEY } from '.'

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
    title: 'Название аккаунта',
    dataIndex: 'name',
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
        <ConfirmModal
          modalTitle={`Удалить аккаунт ${record.exchange}(${record.type})?`}
          onOk={() => SERVICES.EXCHANGE.CREDENTIALS.deleteOne(record.id)}
          invalidateQueryKey={queryKey}
          actionText="Удалить"
          cancelText="Отмена"
          okText="Удалить"
          okType="danger"
        />
      </Space>
    ),
    align: 'center',
  },
]

interface Props {}

const CredentialsTable: React.FC<Props> = ({}) => {
  return (
    <DataTable
      fetchData={SERVICES.EXCHANGE.CREDENTIALS.fetchAll}
      queryKey={TRADING_BOT_CREDENTIALS_QUERY_KEY}
      parseDataSource={parseDataSource}
      columns={getColumns(TRADING_BOT_CREDENTIALS_QUERY_KEY)}
      tableProps={{
        style: {
          width: 'max-content',
          margin: '0 auto',
        },
      }}
    />
  )
}

export default memo(CredentialsTable)
