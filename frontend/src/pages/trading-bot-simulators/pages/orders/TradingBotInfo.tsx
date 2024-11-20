import Block from '@/components/Block/Block'
import { TradePosition } from '@/services/trading-bot.service'
import { TradingBotSimulator } from '@/services/trading-services.service'
import { formatDate } from '@/utils'
import { Descriptions, DescriptionsProps, Flex, Tag } from 'antd'
import React, { memo } from 'react'

const getBotDescriptionItems = (bot: TradingBotSimulator): DescriptionsProps['items'] => [
  {
    label: 'Символ',
    children: `${bot.baseCurrency}${bot.quoteCurrency}`,
  },
  {
    label: 'Позиция',
    children: (
      <Tag color={bot.position === TradePosition.LONG ? 'green' : 'red'}>
        {bot.position === TradePosition.LONG ? 'LONG' : 'SHORT'}
      </Tag>
    ),
  },
  {
    label: 'Объем сетки',
    children: `${bot.gridVolume.toString()} ${bot.baseCurrency}`,
  },
  {
    label: 'Шаг сетки',
    children: `${bot.gridStep.toString()} ${bot.quoteCurrency}`,
  },
  {
    label: 'Время начало',
    children: formatDate(bot.startTime, { showTime: true }),
  },
  {
    label: 'Время окончания',
    children: formatDate(bot.endTime, { showTime: true }),
  },
]

const getBotStatsDescriptionItems = (
  bot: TradingBotSimulator,
  stats: TradingBotSimulator['stats'],
): DescriptionsProps['items'] => [
  {
    label: 'Цена открытия',
    children: `${stats.openPrice} ${bot.quoteCurrency}`,
  },
  {
    label: 'Высокая цена',
    children: `${stats.highestPrice} ${bot.quoteCurrency}`,
  },
  {
    label: 'Цена закрытия',
    children: `${stats.closePrice} ${bot.quoteCurrency}`,
  },
  {
    label: 'Низкая цена',
    children: `${stats.lowestPrice} ${bot.quoteCurrency}`,
  },
]

type Props = {
  bot: TradingBotSimulator
}

const TradingBotInfo: React.FC<Props> = ({ bot }) => {
  return (
    <Block className="max-w-full p-6 bg-white shadow-md rounded-md">
      <Flex gap={15} wrap>
        <Descriptions
          title="Подробная информация о боте"
          bordered
          size="small"
          rootClassName="w-fit"
          column={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
          items={bot ? getBotDescriptionItems(bot) : []}
        />
        <Descriptions
          title="Статистика цены"
          bordered
          size="small"
          rootClassName="w-fit"
          column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
          items={bot && bot.stats ? getBotStatsDescriptionItems(bot, bot.stats) : []}
        />
      </Flex>
    </Block>
  )
}

export default memo(TradingBotInfo)
