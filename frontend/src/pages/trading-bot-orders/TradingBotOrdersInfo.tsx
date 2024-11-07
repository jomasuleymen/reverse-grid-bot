import Block from '@/components/Block/Block'
import { TradingBot, TradingBotState } from '@/services/trading-bot.service'
import { formatDate } from '@/utils'
import { Badge, Descriptions, DescriptionsProps } from 'antd'
import React, { memo } from 'react'
import { getBotStateLabel } from '../trading-bots/components/TradingBotsTable'

const getBadgeStatus = (state: TradingBotState): 'processing' | 'default' => {
  return state === TradingBotState.Running ? 'processing' : 'default'
}

const getDescriptionItems = (bot: TradingBot): DescriptionsProps['items'] => [
  {
    label: 'Аккаунт',
    children: (
      <span>
        {bot.exchange} ({bot.type})
      </span>
    ),
  },
  {
    label: 'Символ',
    children: `${bot.baseCurrency}${bot.quoteCurrency}`,
  },
  {
    label: 'Статус',
    children: <Badge status={getBadgeStatus(bot.state)} text={getBotStateLabel(bot.state).label} />,
    span: 2,
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
    label: ' Тейк-профит на сетке',
    children: `${bot.takeProfitOnGrid}`,
    span: 2,
  },
  {
    label: 'Создан',
    children: formatDate(bot.createdAt, { showTime: true }),
  },
  {
    label: 'Остановился',
    children: formatDate(bot.stoppedAt, { showTime: true }),
  },
]

type Props = {
  bot: TradingBot
}

const TradingBotOrdersInfo: React.FC<Props> = ({ bot }) => {
  return (
    <Block className="max-w-full p-6 bg-white shadow-md rounded-md">
      <Descriptions
        title="Подробная информация о боте"
        bordered
        size="middle"
        rootClassName="w-fit"
        column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
        items={bot ? getDescriptionItems(bot) : []}
      />
    </Block>
  )
}

export default memo(TradingBotOrdersInfo)
