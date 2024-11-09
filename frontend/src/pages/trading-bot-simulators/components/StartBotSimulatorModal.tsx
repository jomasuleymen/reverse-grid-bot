import Block from '@/components/Block/Block'
import ErrorDisplay from '@/components/ErrorDisplay'
import { TRADING_BOT_CONFIGS_QUERY_KEY } from '@/pages/bot-configs'
import { SERVICES } from '@/services'
import { TradingBotConfig } from '@/services/trading-bot.service'
import { CreateTradingBotSimulator } from '@/services/trading-services.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Col, Form, FormItemProps, Modal, Row, Select, Space } from 'antd'
import React, { useState } from 'react'
import { TRADING_BOT_SIMULATORS_QUERY_KEY } from '..'
import { TradingBotSimulatorsFormItems } from '../forms/create-trading-bot-simulators-form'

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

const StartBotSimulatorModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  const queryClient = useQueryClient()

  const { isFetching, isSuccess, data } = useQuery<TradingBotConfig[]>({
    queryKey: [...TRADING_BOT_CONFIGS_QUERY_KEY],
    queryFn: () => SERVICES.TRADING_BOT.CONFIGS.fetchAll(),
    refetchOnWindowFocus: false,
  })

  const configs = data || []

  const {
    mutate: createSimulator,
    isPending: isSubmitting,
    error,
    isError,
    reset,
  } = useMutation({
    mutationFn: (formData: CreateTradingBotSimulator) =>
      SERVICES.TRADING_SERVICES.TRADING_BOT_SIMULATOR.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRADING_BOT_SIMULATORS_QUERY_KEY })
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
        takeProfitOnGrid: selectedConfig.takeProfitOnGrid,
      })
    }
  }

  const onFinish = (values: CreateTradingBotSimulator) => {
    createSimulator(values)
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
      <br />
      <b>Тейк-профит на сетке:</b> {config.takeProfitOnGrid + ' ' + config.quoteCurrency}
    </>
  )

  return (
    <>
      <Block transparency className="max-w-full">
        <Button onClick={handleOpenModal} type="primary">
          Создать
        </Button>
      </Block>

      <Modal
        title="Создание симулятора"
        open={isModalOpen}
        onCancel={handleCancel}
        onClose={handleCancel}
        footer={null}
        centered
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
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

          {TradingBotSimulatorsFormItems.map((item, idx) =>
            Array.isArray(item) ? (
              <Space style={{ display: 'flex', width: '100%' }} key={'items-' + idx}>
                {item.map(getFormItem)}
              </Space>
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
                Создать
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  )
}

export default StartBotSimulatorModal
