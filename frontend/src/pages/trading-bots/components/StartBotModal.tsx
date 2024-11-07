import Block from '@/components/Block/Block'
import { TRADING_BOT_CONFIGS_QUERY_KEY } from '@/pages/bot-configs'
import { BotConfigFormItems } from '@/pages/bot-configs/BotConfigsTopBar'
import { TRADING_BOT_CREDENTIALS_QUERY_KEY } from '@/pages/exchange-credentials'
import { SERVICES } from '@/services'
import { ExchangeCredentials } from '@/services/exchanges.service'
import { IStartBotOptions, TradingBotConfig } from '@/services/trading-bot.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Col, Form, FormItemProps, Modal, Row, Select, Space } from 'antd'
import React, { useState } from 'react'
import { TRADING_BOTS_QUERY_KEY } from '..'

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

const StartBotModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

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
        takeProfitOnGrid: selectedConfig.takeProfitOnGrid,
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
      <br />
      <b>Тейк-профит на сетке:</b> {config.takeProfitOnGrid + ' ' + config.quoteCurrency}
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
                  {`${credential.exchange} - ${credential.type}`}
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

          {BotConfigFormItems.map((item, idx) =>
            Array.isArray(item) ? (
              <Space style={{ display: 'flex', width: '100%' }} key={'items-' + idx}>
                {item.map(getFormItem)}
              </Space>
            ) : (
              getFormItem(item)
            ),
          )}

          {isError && (
            <Alert
              message={
                <ul>
                  <li>{error.message}</li>
                </ul>
              }
              type="error"
              style={{ marginBottom: '20px' }}
            />
          )}

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
