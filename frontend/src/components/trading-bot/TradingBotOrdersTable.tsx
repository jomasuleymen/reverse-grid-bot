import Block from '@/components/Block/Block'
import {
  ITradingOrderBase,
  OrdersWithSummaryBase,
  OrderWithSummaryBase,
} from '@/services/orders-summary.service'
import { TradingOrderSide } from '@/services/trading-bot.service'
import { formatDate } from '@/utils'
import { Descriptions, DescriptionsProps, Space, Spin, Tag, Typography } from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import React, { memo } from 'react'

const { Text } = Typography

const parseDataSource = (data: OrderWithSummaryBase[]): OrderWithSummaryBase[] => {
  if (!data) return []

  return data
    .toSorted((a, b) => a.id - b.id)
    .map((item, index) => ({
      key: item.id,
      index: index + 1,
      ...item,
    }))
}

const getDescriptionItems = (
  data: OrdersWithSummaryBase,
  config: Props['configs'],
): DescriptionsProps['items'] => [
  {
    label: 'PnL',
    children: (
      <span>
        {Number(data.pnl.netPnl.toFixed(5))} {config.quoteCurrency}
      </span>
    ),
  },
  {
    label: 'Нереализованная прибыль',
    children: (
      <span>
        {Number(data.pnl.unrealizedPnl.toFixed(5))} {config.quoteCurrency}
      </span>
    ),
  },
  {
    label: 'Реализованная прибыль',
    children: (
      <span>
        <b>Общая: {Number(data.pnl.realizedPnl.toFixed(5))}</b>
        <br />
        <span>Прибыль: {Number(data.pnl.totalProfit.toFixed(5))}</span>
        <br />
        <span>Комиссия: {-Number(data.pnl.fee.toFixed(5))}</span>
      </span>
    ),
  },
  {
    label: 'Нереализованная комиссия',
    children: (
      <span>
        {-data.pnl.unrealizedFees.toFixed(5)} {config.quoteCurrency}
      </span>
    ),
    span: 3,
  },
  {
    label: 'Кол-во операций',
    children: (
      <div>
        <Text type="success">{data.buyOrdersCount}</Text> |{' '}
        <Text type="danger">{data.sellOrdersCount}</Text> |{' '}
        <Text type="warning">{Math.abs(data.buyOrdersCount - data.sellOrdersCount)}</Text>
      </div>
    ),
    span: 3,
  },
  {
    label: 'PnL статистика',
    children: (
      <div>
        <span>
          Макс:{' '}
          <Text type={data.statistics.maxPnl < 0 ? 'danger' : 'success'}>
            {Number(data.statistics.maxPnl.toFixed(5))}
            {data.statistics.maxPnlIndex && ` | ${data.statistics.maxPnlIndex}`}
          </Text>
        </span>
        <br />
        <span>
          Мин:{' '}
          <Text type={data.statistics.minPnl < 0 ? 'danger' : 'success'}>
            {Number(data.statistics.minPnl.toFixed(5))}
            {data.statistics.minPnlIndex && ` | ${data.statistics.minPnlIndex}`}
          </Text>
        </span>
      </div>
    ),
    span: 3,
  },
]

const getColumns = (
  config: Props['configs'],
  hiddenColumns: Props['hiddenColumns'] = {},
): ColumnsType<OrderWithSummaryBase> => [
  {
    title: '№',
    dataIndex: 'index',
    align: 'center',
    sorter: (a, b) => a.id - b.id,
    showSorterTooltip: false,
    sortDirections: ['descend'],
  },
  {
    title: 'Количество',
    dataIndex: 'quantity',
    hidden: hiddenColumns['quantity'],
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
    hidden: hiddenColumns['avgPrice'],
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
    hidden: hiddenColumns['triggerPrice'],
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
    title: 'Сторона',
    dataIndex: 'side',
    hidden: hiddenColumns['side'],
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
    hidden: hiddenColumns['fee'],
    align: 'center',
    render: (value, record) => (
      <span>
        {value.toFixed(5)} {record.feeCurrency}
      </span>
    ),
  },
  {
    title: 'ID ордера',
    dataIndex: 'orderId',
    hidden: hiddenColumns['orderId'],
    align: 'center',
  },
  {
    title: 'Дата создания',
    dataIndex: 'createdDate',
    hidden: hiddenColumns['createdDate'],
    align: 'center',
    sorter: (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    render: (value: Date) => <span>{formatDate(value, { showTime: true })}</span>,
  },
]

function getExpandDetails(record: OrderWithSummaryBase, configs: Props['configs']) {
  if (!record) return

  const data = {
    PnL: record.pnl.netPnl.toFixed(2) + ' ' + configs.quoteCurrency,
    'Нереализованная прибыль': record.pnl.unrealizedPnl.toFixed(2) + ' ' + configs.quoteCurrency,
    'Реализованная прибыль': record.pnl.realizedPnl.toFixed(2) + ' ' + configs.quoteCurrency,
    'Сумма комиссии': -record.pnl.fee.toFixed(2) + ' ' + configs.quoteCurrency,
    Прибыль: record.pnl.totalProfit.toFixed(2) + ' ' + configs.quoteCurrency,
    Покупки: record.buyOrdersCount,
    Продажи: record.sellOrdersCount,
  }

  return Object.entries(data).map(([key, value]) => (
    <div key={key}>
      <b>{key}:</b> {value}
    </div>
  ))
}

type Props = {
  configs: {
    baseCurrency: string
    quoteCurrency: string
  }
  hiddenColumns?: Partial<Record<keyof ITradingOrderBase, boolean>>
  isPending: boolean
  isSuccess: boolean
  data?: OrdersWithSummaryBase | null
}

const TradingBotOrdersTable: React.FC<Props> = ({
  configs,
  hiddenColumns,
  isPending,
  isSuccess,
  data,
}) => {
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
            items={isSuccess && data ? getDescriptionItems(data, configs) : []}
          />
        </Spin>
        <Table<OrderWithSummaryBase>
          loading={isPending}
          columns={getColumns(configs, hiddenColumns) as any}
          dataSource={isSuccess && data ? parseDataSource(data.positions) : []}
          pagination={false}
          bordered={true}
          scroll={{ x: 'max-content' }}
          size="middle"
          rowClassName={(record: OrderWithSummaryBase) => {
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
