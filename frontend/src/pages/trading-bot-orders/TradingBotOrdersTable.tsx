import Block from '@/components/Block/Block'
import { SERVICES } from '@/services'
import {
  OrdersWithSummary,
  OrderWithSummary,
  TradingOrderSide,
} from '@/services/trading-bot.service'
import { formatDate } from '@/utils'
import { useQuery } from '@tanstack/react-query'
import { Descriptions, DescriptionsProps, Space, Spin, Tag } from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import React, { memo } from 'react'

const parseDataSource = (data: OrderWithSummary[]): OrderWithSummary[] => {
  if (!data) return []

  return data.map((item) => ({
    key: item.id,
    ...item,
  }))
}

const getColumns = (config: Props['configs']): ColumnsType<OrderWithSummary> => [
  {
    title: '№',
    align: 'center',
    render(_, record, index) {
      return index + 1
    },
  },
  {
    title: 'ID ордера',
    dataIndex: 'orderId',
    align: 'center',
    render: (value) => <span>{value}</span>,
  },
  {
    title: 'Количество',
    dataIndex: 'quantity',
    align: 'center',
    render: (value) => (
      <span>
        {value} {config.baseCurrency}
      </span>
    ),
  },
  {
    title: 'Сторона',
    dataIndex: 'side',
    align: 'center',
    filters: [
      {
        text: 'BUY',
        value: TradingOrderSide.BUY,
      },
      {
        text: 'SELL',
        value: TradingOrderSide.SELL,
      },
    ],
    onFilter: (value, record) => record.side === value,
    render: (value: string) => (
      <Tag color={value === TradingOrderSide.BUY ? 'green' : 'red'}>{value.toUpperCase()}</Tag>
    ),
  },
  {
    title: 'Покупная цена',
    dataIndex: 'avgPrice',
    align: 'center',
    sorter: (a, b) => a.avgPrice - b.avgPrice,
    render: (value) => (
      <span>
        {value.toFixed(2)} {config.quoteCurrency}
      </span>
    ),
  },
  {
    title: 'Триггерная цена',
    dataIndex: 'triggerPrice',
    align: 'center',
    render: (value) =>
      value ? (
        <span>
          {value.toFixed(2)} {config.quoteCurrency}
        </span>
      ) : (
        '-'
      ),
  },
  {
    title: 'Комиссия',
    dataIndex: 'fee',
    align: 'center',
    render: (value, record) => (
      <span>
        {value.toFixed(6)} {record.feeCurrency}
      </span>
    ),
  },
  {
    title: 'Дата создания',
    dataIndex: 'createdDate',
    align: 'center',
    sorter: (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    render: (value: Date) => <span>{formatDate(value, { showTime: true })}</span>,
  },
]

const getDescriptionItems = (
  data: OrdersWithSummary,
  config: Props['configs'],
): DescriptionsProps['items'] => [
  {
    label: 'PnL',
    children: (
      <span>
        {data.pnl.netPnl.toFixed(6)} {config.quoteCurrency}
      </span>
    ),
  },
  {
    label: 'Нереализованная прибыль',
    children: (
      <span>
        {data.pnl.unrealizedPnl.toFixed(6)} {config.quoteCurrency}
      </span>
    ),
  },
  {
    label: 'Реализованная прибыль',
    children: (
      <span>
        {data.pnl.realizedPnl.toFixed(6)} {config.quoteCurrency}
      </span>
    ),
  },
  {
    label: 'Сумма комиссии',
    children: (
      <span>
        {data.pnl.fee.toFixed(6)} {config.quoteCurrency}
      </span>
    ),
    span: 3,
  },
  {
    label: 'Кол-во покупки (Buy)',
    children: <span>{data.buyOrdersCount} шт</span>,
    span: 3,
  },
  {
    label: 'Кол-во продажи (Sell)',
    children: <span>{data.sellOrdersCount} шт</span>,
    span: 3,
  },
]

type Props = {
  botId: string
  configs: {
    baseCurrency: string
    quoteCurrency: string
  }
}

function getExpandDetails(record: OrderWithSummary, configs: Props['configs']) {
  if (!record) return

  const data = {
    PnL: record.pnl.netPnl.toFixed(2) + ' ' + configs.quoteCurrency,
    'Нереализованная прибыль': record.pnl.unrealizedPnl.toFixed(2) + ' ' + configs.quoteCurrency,
    'Реализованная прибыль': record.pnl.realizedPnl.toFixed(2) + ' ' + configs.quoteCurrency,
    'Сумма комиссии': record.pnl.fee.toFixed(2) + ' ' + configs.quoteCurrency,
    Убыток: record.pnl.totalProfit.toFixed(2) + ' ' + configs.quoteCurrency,
    Покупки: record.buyOrdersCount,
    Продажи: record.sellOrdersCount,
  }

  return Object.entries(data).map(([key, value]) => (
    <div key={key}>
      <b>{key}:</b> {value}
    </div>
  ))
}

const TradingBotOrdersTable: React.FC<Props> = ({ botId, configs }) => {
  const { isPending, isSuccess, data } = useQuery({
    queryKey: ['trading-bot-orders-with-summaries', botId],
    queryFn: () => SERVICES.TRADING_BOT.ORDERS.getOrdersWithSummary(botId!),
    refetchOnWindowFocus: false,
  })

  return (
    <Block className="max-w-full">
      <Space direction="vertical" style={{ display: 'flex' }}>
        <Spin spinning={isPending}>
          <Descriptions
            title="Подробная информация ордера"
            bordered
            size="small"
            rootClassName="w-fit"
            column={{ xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 }}
            items={data && getDescriptionItems(data, configs)}
          />
        </Spin>
        <Table<OrderWithSummary>
          loading={isPending}
          columns={getColumns(configs) as any}
          dataSource={isSuccess ? parseDataSource(data.positions) : []}
          pagination={false}
          bordered={true}
          scroll={{ x: 'max-content' }}
          size="middle"
          rowClassName={(record: OrderWithSummary) => {
            if (record.isMaxPnl) {
              return 'bg-green-50'
            }

            if (record.isMinPnl) {
              return 'bg-red-50'
            }

            return ''
          }}
          expandable={{
            rowExpandable: (record) => {
              return !!record.pnl
            },
            expandedRowRender: (record) => getExpandDetails(record, configs),
          }}
        />
      </Space>
    </Block>
  )
}

export default memo(TradingBotOrdersTable)
