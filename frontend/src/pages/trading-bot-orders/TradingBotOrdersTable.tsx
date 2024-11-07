import Block from '@/components/Block/Block'
import DataTable from '@/components/DataTable'
import { SERVICES } from '@/services'
import { IBotSummary, TradingBotOrder, TradingOrderSide } from '@/services/trading-bot.service'
import { formatDate } from '@/utils'
import { useQuery } from '@tanstack/react-query'
import { Descriptions, DescriptionsProps, Space, Spin, Tag } from 'antd'
import { ColumnsType, ColumnType } from 'antd/es/table'
import React, { memo } from 'react'

const parseDataSource = (data: TradingBotOrder[]): ColumnType[] => {
  if (!data) return []

  return data.map((item) => ({
    key: item.id,
    ...item,
  }))
}
const getColumns = (config: Props['configs']): ColumnsType<TradingBotOrder> => [
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
  {
    title: 'Кастомный ID',
    dataIndex: 'customId',
    align: 'center',
    render: (value) => <span>{value}</span>,
  },
]

const getDescriptionItems = (
  data: IBotSummary,
  config: Props['configs'],
): DescriptionsProps['items'] => [
  {
    label: 'Прибыль',
    children: (
      <span>
        {data.pnl.PnL.toFixed(6)} {config.quoteCurrency}
      </span>
    ),
  },
  {
    label: 'Нереализованная прибыль',
    children: (
      <span>
        {data.pnl.unrealizedPnL.toFixed(6)} {config.quoteCurrency}
      </span>
    ),
  },
  {
    label: 'Реализованная прибыль',
    children: (
      <span>
        {data.pnl.realizedPnL.toFixed(6)} {config.quoteCurrency}
      </span>
    ),
  },
  {
    label: 'Сумма комиссии',
    children: (
      <span>
        {data.sumComission.toFixed(6)} {config.quoteCurrency}
      </span>
    ),
    span: 3,
  },
  {
    label: 'Кол-во покупки (Buy)',
    children: <span>{data.buyCount} шт</span>,
    span: 3,
  },
  {
    label: 'Кол-во продажи (Sell)',
    children: <span>{data.sellCount} шт</span>,
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

const TradingBotOrdersTable: React.FC<Props> = ({ botId, configs }) => {
  const queryKey = ['trading-bot-orders', botId.toString()]

  const {
    isPending,
    isSuccess,
    data: botSummary,
  } = useQuery({
    queryKey: ['trading-bot-summary', botId],
    queryFn: () => SERVICES.TRADING_BOT.getBotSummary(botId!),
    refetchOnWindowFocus: false,
  })

  return (
    <Block className="max-w-full">
      <Space direction="vertical" style={{ display: 'flex' }}>
        <Spin spinning={isPending}>
          <Descriptions
            title="Подробная информация о ордера"
            bordered
            size="small"
            rootClassName="w-fit"
            column={{ xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 }}
            items={botSummary && getDescriptionItems(botSummary, configs)}
          />
        </Spin>
        <DataTable
          fetchData={() => SERVICES.TRADING_BOT.ORDERS.fetchByBotId(botId)}
          queryKey={queryKey}
          parseDataSource={parseDataSource}
          columns={getColumns(configs)}
        />
      </Space>
    </Block>
  )
}

export default memo(TradingBotOrdersTable)
