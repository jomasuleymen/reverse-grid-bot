import ConfirmModal from '@/components/ConfirmModal'
import DataTable from '@/components/DataTable'
import { ColumnsType } from 'antd/es/table'
import React, { memo } from 'react'

import UpsertModalForm from '@/components/UpsertModalForm'
import { SERVICES } from '@/services'
import { TradingBotConfig } from '@/services/trading-bot.service'
import { Space } from 'antd'
import { TRADING_BOT_CONFIGS_QUERY_KEY } from '.'
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
    title: 'Базовая валюта',
    dataIndex: 'baseCurrency',
    align: 'center',
  },
  {
    title: 'Котируемая валюта',
    dataIndex: 'quoteCurrency',
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
    title: 'Действия',
    key: 'action',
    render: (_, record: ColumnType) => (
      <Space>
        <ConfirmModal
          modalTitle="Удалить настройку?"
          onOk={() => SERVICES.TRADING_BOT.CONFIGS.deleteOne(record.id)}
          invalidateQueryKey={queryKey}
          actionText="Удалить"
          cancelText="Отмена"
          okText="Удалить"
          okType="danger"
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

interface Props {}

const BotConfigsTable: React.FC<Props> = ({}) => {
  return (
    <DataTable
      fetchData={SERVICES.TRADING_BOT.CONFIGS.fetchAll}
      queryKey={TRADING_BOT_CONFIGS_QUERY_KEY}
      parseDataSource={parseDataSource}
      columns={getColumns(TRADING_BOT_CONFIGS_QUERY_KEY)}
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
