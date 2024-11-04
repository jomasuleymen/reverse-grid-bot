import Block from '@/components/Block/Block'
import { TRADING_BOT_CREDENTIALS_QUERY_KEY } from '@/pages/exchange-credentials'
import { SERVICES } from '@/services'
import { ExchangeCredentials } from '@/services/exchanges.service'
import { TradingBotConfig } from '@/services/trading-bot.service'
import { useQuery } from '@tanstack/react-query'
import { Button, Col, Modal, Radio, Row, Select, Space } from 'antd'
import React, { useState } from 'react'

type Props = {}

const StartBotModal: React.FC<Props> = ({}) => {
  const [modalOpen, setModalOpen] = useState(false)

  const { isPending, isSuccess, data } = useQuery<[ExchangeCredentials[], TradingBotConfig[]]>({
    queryKey: TRADING_BOT_CREDENTIALS_QUERY_KEY,
    queryFn: () =>
      Promise.all([
        SERVICES.EXCHANGE.CREDENTIALS.fetchAll(),
        SERVICES.TRADING_BOT.CONFIGS.fetchAll(),
      ]),
    refetchOnWindowFocus: false,
  })

  const credentials = isSuccess ? data[0] : []
  const configs = isSuccess ? data[1] : []

  const handleCancel = () => {
    setModalOpen(false)
  }

  return (
    <>
      <Block transparency className="max-w-full">
        <Button onClick={() => setModalOpen(true)} type="primary">
          Новый бот
        </Button>
      </Block>

      {modalOpen && (
        <Modal
          title={'TITLE'}
          open={modalOpen}
          centered={true}
          footer={
            <Row align="middle" justify="end" gutter={[10, 10]}>
              <Col>
                <Button htmlType="button" onClick={handleCancel}>
                  Отменить
                </Button>
              </Col>
              <Col>
                <Button type="primary" htmlType="submit" loading={isPending}>
                  Запускать
                </Button>
              </Col>
            </Row>
          }
          closeIcon={false}
        >
          <Select className="w-full">
            {credentials.map((credential) => (
              <Select.Option>{`${credential.exchange} - ${credential.type}`}</Select.Option>
            ))}
          </Select>
          <Radio.Group onChange={() => {}}>
            <Space direction="vertical">
              {configs.map((config) => (
                <Radio value={config.id}>{config.symbol}</Radio>
              ))}
            </Space>
          </Radio.Group>
        </Modal>
      )}
    </>
  )
}

export default StartBotModal
