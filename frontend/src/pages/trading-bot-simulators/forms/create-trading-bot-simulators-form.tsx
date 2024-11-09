import { DatePicker, FormItemProps, Input } from 'antd'

import CustomInputNumber from '@/components/CustomInputNumber'
import { CreateTradingBotSimulator } from '@/services/trading-services.service'

type FormItemType = FormItemProps<CreateTradingBotSimulator>

export const TradingBotSimulatorsFormItems: (FormItemType | FormItemType[])[] = [
  [
    {
      label: 'Базовая валюта',
      name: 'baseCurrency',
      rules: [{ required: true }],
      required: true,
      children: <Input />,
    },
    {
      label: 'Котируемая валюта',
      name: 'quoteCurrency',
      rules: [{ required: true }],
      required: true,
      children: <Input />,
    },
  ],
  {
    label: 'Объем сетки (Базовая валюта)',
    name: 'gridVolume',
    rules: [{ required: true }],
    required: true,
    children: <CustomInputNumber />,
  },
  {
    label: 'Шаг сетки (Котируемая валюта)',
    name: 'gridStep',
    rules: [{ required: true }],
    required: true,
    children: <CustomInputNumber />,
  },
  {
    label: 'Время начало',
    name: 'startTime',
    rules: [{ required: true }],
    required: true,
    children: <DatePicker showTime />,
  },
  {
    label: 'Время окончания',
    name: 'endTime',
    rules: [{ required: true }],
    required: true,
    children: <DatePicker showTime />,
  },
]
