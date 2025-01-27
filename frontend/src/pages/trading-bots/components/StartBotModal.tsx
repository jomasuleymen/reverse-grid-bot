import Block from '@/components/Block/Block'
import CustomInputNumber from '@/components/CustomInputNumber'
import ErrorDisplay from '@/components/ErrorDisplay'
import { TRADING_BOT_CONFIGS_QUERY_KEY } from '@/pages/bot-configs'
import {
  BotConfigFormItems,
  TCreateTradingBotConfigForm,
} from '@/pages/bot-configs/BotConfigsTopBar'
import { TRADING_BOT_CREDENTIALS_QUERY_KEY } from '@/pages/exchange-credentials'
import { SERVICES } from '@/services'
import { ExchangeCredentials } from '@/services/exchanges.service'
import { IStartBotOptions, TradePosition, TradingBotConfig } from '@/services/trading-bot.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Flex,
  Form,
  FormItemProps,
  Modal,
  Radio,
  Row,
  Select,
} from 'antd'
import React, { useState } from 'react'
import { TRADING_BOTS_QUERY_KEY } from '..'

const tradingPrerequisitesMessages = [
  'Валюта тикера используется как залог для маржинальной торговли',
  'Маржинальная торговля включена для данной валюты',
  'Доступный баланс для маржинальной торговли имеется в кошельке',
  'Маржинальная ставка не превышает установленный предел',
  'Доступны необходимые разрешения для проведения маржинальных операций',
  'Пользователь подтвердил рискованность маржинальной торговли',
]

type FormItemType = FormItemProps<TCreateTradingBotConfigForm>

const StartBotFormItems: (FormItemType | FormItemType[])[] = [
  ...BotConfigFormItems,
  {
    label: 'Старт триггер',
    name: 'triggerPrice',
    children: <CustomInputNumber />,
  },
  {
    label: 'Тейк-профит на Pnl',
    name: 'takeProfitOnPnl',
    children: <CustomInputNumber />,
  },
  [
    {
      label: 'Тейк-профит на сетке',
      name: 'takeProfitOnGrid',
      children: <CustomInputNumber />,
    },
    {
      label: 'Тейк-профит',
      name: 'takeProfit',
      children: <CustomInputNumber />,
    },
  ],
  {
    label: 'Позиция',
    name: 'position',
    rules: [{ required: true }],
    required: true,
    children: (
      <Radio.Group optionType="button">
        <Radio.Button value={TradePosition.LONG}>LONG</Radio.Button>
        <Radio.Button value={TradePosition.SHORT}>SHORT</Radio.Button>
      </Radio.Group>
    ),
  },
  {
    name: 'tradeOnStart',
    valuePropName: 'checked',
    initialValue: true,
    label: null,
    children: <Checkbox checked>Немедленная торговля</Checkbox>,
  },
]

const getFormItem = (item: FormItemProps, hidden?: boolean) => {
  return (
    <Form.Item
      key={item.name?.toString()}
      label={item.label}
      name={item.name}
      rules={item.rules}
      children={item.children}
      style={{ flex: 1 }}
      hidden={hidden}
      {...item}
    />
  )
}

const StartBotModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const tradeOnStart = Form.useWatch('tradeOnStart', form)

  const queryClient = useQueryClient()

  // Fetch credentials and configs
  const { isFetching, isSuccess, data } = useQuery<[ExchangeCredentials[], TradingBotConfig[]]>({
    queryKey: [...TRADING_BOT_CREDENTIALS_QUERY_KEY, ...TRADING_BOT_CONFIGS_QUERY_KEY],
    queryFn: () =>
      Promise.all([
        SERVICES.EXCHANGE.CREDENTIALS.fetchAll(),
        SERVICES.TRADING_BOT.CONFIGS.fetchAll(),
      ]),
    refetchOnWindowFocus: false,
  })

  const credentials = isSuccess ? data[0] : []
  const configs = isSuccess ? data[1] : []

  const {
    mutate: startBot,
    isPending: isSubmitting,
    error,
    isError,
    reset,
  } = useMutation({
    mutationFn: (formData: IStartBotOptions) => SERVICES.TRADING_BOT.startBot(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRADING_BOTS_QUERY_KEY })
      setIsModalOpen(false)
    },
  })

  const handleTemplateSelect = (value: number) => {
    const selectedConfig = configs.find((config) => config.id === value)
    if (selectedConfig) {
      form.setFieldsValue({
        baseCurrency: selectedConfig.baseCurrency,
        quoteCurrency: selectedConfig.quoteCurrency,
        gridStep: selectedConfig.gridStep,
        gridVolume: selectedConfig.gridVolume,
      })
    }
  }

  const onFinish = (values: IStartBotOptions) => {
    startBot(values)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    reset()
    form.resetFields()
  }

  const renderBotDetails = (config: TradingBotConfig) => (
    <>
      <b>Символ:</b> {config.baseCurrency + config.quoteCurrency}
      <br />
      <b>Объем сетки:</b> {config.gridVolume + ' ' + config.baseCurrency}
      <br />
      <b>Шаг сетки:</b> {config.gridStep + ' ' + config.quoteCurrency}
    </>
  )

  return (
    <>
      <Block transparency className="max-w-full">
        <Button onClick={handleOpenModal} type="primary">
          Новый бот
        </Button>
      </Block>

      <Modal
        title="Запустить бота"
        open={isModalOpen}
        onCancel={handleCancel}
        onClose={handleCancel}
        footer={null}
        centered
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item label="Учетные данные" name="credentialsId" rules={[{ required: true }]}>
            <Select placeholder="Выберите учетные данные" loading={isFetching}>
              {credentials.map((credential) => (
                <Select.Option key={credential.id} value={credential.id}>
                  {`${credential.exchange} - ${credential.type} - ${credential.name}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Select
            placeholder="Применить шаблона"
            className="w-full mb-4"
            labelRender={(value) => {
              return 'Применить шаблона'
            }}
            onSelect={handleTemplateSelect}
          >
            {configs.map((config) => (
              <Select.Option key={config.id} value={config.id}>
                {renderBotDetails(config)}
              </Select.Option>
            ))}
          </Select>
          {StartBotFormItems.map((item, idx) => {
            if (Array.isArray(item)) {
              return (
                <Flex gap={10} key={'items-' + idx}>
                  {item.map((item) => getFormItem(item))}
                </Flex>
              )
            }

            if (item.name === 'triggerPrice') {
              return getFormItem(item, tradeOnStart)
            }

            return getFormItem(item)
          })}

          {isError && <ErrorDisplay className="mb-2" error={error as any} />}

          <Alert
            message={<b>Проверьте перед запуском бота!</b>}
            className="mb-2"
            description={
              <ul>
                {tradingPrerequisitesMessages.map((text, index) => (
                  <li key={index}>
                    {index + 1}. {text}
                  </li>
                ))}
              </ul>
            }
            type="warning"
            showIcon
          />

          <Row justify="end" gutter={10}>
            <Col>
              <Button onClick={handleCancel} disabled={isSubmitting}>
                Отменить
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Запускать
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  )
}

export default StartBotModal
