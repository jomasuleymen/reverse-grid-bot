import Block from '@/components/Block/Block'
import CustomInputNumber from '@/components/CustomInputNumber'
import ErrorDisplay from '@/components/ErrorDisplay'
import { TCreateTradingBotConfigForm } from '@/pages/bot-configs/BotConfigsTopBar'
import { SERVICES } from '@/services'
import { TradingBot, TradingBotConfig } from '@/services/trading-bot.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Col, Flex, Form, FormItemProps, Modal, Row } from 'antd'
import React, { useEffect, useState } from 'react'
import { TRADING_BOTS_QUERY_KEY } from '..'

type FormItemType = FormItemProps<TCreateTradingBotConfigForm>

const EditBotFormItems: (FormItemType | FormItemType[])[] = [
  {
    label: 'Объем сетки (Базовая валюта)',
    name: 'gridVolume',
    children: <CustomInputNumber />,
  },
  {
    label: 'Шаг сетки (Котируемая валюта)',
    name: 'gridStep',
    children: <CustomInputNumber />,
  },
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
]

const getFormItem = (item: FormItemProps) => {
  return (
    <Form.Item
      key={item.name?.toString()}
      label={item.label}
      name={item.name}
      rules={item.rules}
      children={item.children}
      style={{ flex: 1 }}
      {...item}
    />
  )
}

type Props = {
  botId: string | number
}

const EditBotModal: React.FC<Props> = ({ botId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  const queryClient = useQueryClient()

  const { isFetching, isSuccess, data } = useQuery<TradingBot>({
    queryKey: [TRADING_BOTS_QUERY_KEY, botId],
    queryFn: () => SERVICES.TRADING_BOT.fetchById(botId),
    refetchOnWindowFocus: false,
  })

  const {
    mutate: startBot,
    isPending: isSubmitting,
    error,
    isError,
    reset,
  } = useMutation({
    mutationFn: (formData: TradingBotConfig) => SERVICES.TRADING_BOT.editBot(botId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRADING_BOTS_QUERY_KEY })
      setIsModalOpen(false)
    },
  })

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        gridStep: data.gridStep,
        gridVolume: data.gridVolume,
        takeProfitOnGrid: data.takeProfitOnGrid,
        takeProfit: data.takeProfit,
        takeProfitOnPnl: data.takeProfitOnPnl,
      })
    }
  }, [data])

  const onFinish = (values: TradingBotConfig) => {
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

  return (
    <>
      <Block transparency className="max-w-full">
        <Button onClick={handleOpenModal} type="link" disabled={isFetching}>
          Изменить
        </Button>
      </Block>

      <Modal
        title="Изменить бота"
        open={isModalOpen}
        onCancel={handleCancel}
        onClose={handleCancel}
        footer={null}
        centered
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          {EditBotFormItems.map((item, idx) =>
            Array.isArray(item) ? (
              <Flex gap={10} key={'items-' + idx}>
                {item.map(getFormItem)}
              </Flex>
            ) : (
              getFormItem(item)
            ),
          )}

          {isError && <ErrorDisplay className="mb-2" error={error as any} />}

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

export default EditBotModal
