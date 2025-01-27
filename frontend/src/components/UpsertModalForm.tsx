import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Col, Flex, Form, FormItemProps, Modal, Row } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import ErrorDisplay from './ErrorDisplay'

interface UpsertModalFormProps<TFormData, TResponse, TError> {
  validate?: (formData: TFormData) => string | string[] | null | undefined
  onSubmit: (formData: TFormData) => Promise<TResponse>
  parseError: (error: TError) => string | string[]
  title: string
  buttonText: string
  queryKey?: string[]
  formItems: (FormItemProps<TFormData> | FormItemProps<TFormData>[])[]
  update?: boolean
  initialValues?: TFormData
}

function formatErrors(error: string[] | string): string[] {
  if (Array.isArray(error)) {
    return error
  }
  return [error]
}

function UpsertModalForm<TFormData extends Record<string, any>, TResponse, TError>(
  props: UpsertModalFormProps<TFormData, TResponse, TError>,
) {
  const {
    validate,
    onSubmit,
    parseError,
    buttonText,
    title,
    queryKey,
    formItems,
    update = false,
    initialValues,
  } = props
  const [modalOpen, setModalOpen] = useState(false)
  const [errors, setErrors] = useState<string[] | null>()
  const queryClient = useQueryClient()

  const { isPending, isError, data, error, mutate } = useMutation<TResponse, TError, TFormData>({
    mutationFn: async (formData) => {
      return (await onSubmit(formData)) as any
    },
    onSuccess: () => {
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })

  const onFinish = async (formData: TFormData) => {
    if (validate) {
      const validationErrors = validate(formData)
      if (validationErrors) {
        return setErrors(formatErrors(validationErrors))
      }
    }

    mutate(formData)
  }

  const handleCancel = () => {
    setModalOpen(false)
    setErrors(null)
  }

  const getFormItem = useCallback((item: FormItemProps<TFormData>) => {
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
  }, [])

  useEffect(() => {
    if (isError) {
      const parsedError = parseError(error)
      setErrors(formatErrors(parsedError))
    } else if (data) {
      setErrors(null)
      setModalOpen(false)
    }
  }, [isError, data])

  return (
    <>
      <Button type={update ? 'link' : 'primary'} onClick={() => setModalOpen(true)}>
        {buttonText}
      </Button>
      {modalOpen && (
        <Modal title={title} open={modalOpen} centered={true} footer={false} closeIcon={false}>
          <Form
            layout="vertical"
            initialValues={initialValues || {}}
            style={{ maxWidth: 600 }}
            onFinish={onFinish}
          >
            {formItems.map((item, idx) =>
              Array.isArray(item) ? (
                <Flex gap={10} key={'items-' + idx}>
                  {item.map(getFormItem)}
                </Flex>
              ) : (
                getFormItem(item)
              ),
            )}

            {errors && <ErrorDisplay className="mb-2" error={error as any} />}
            <Row align="middle" justify="end" gutter={[10, 10]}>
              <Col>
                <Form.Item>
                  <Button htmlType="button" onClick={handleCancel}>
                    Отменить
                  </Button>
                </Form.Item>
              </Col>
              <Col>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    {update ? 'Обновить' : 'Добавить'}
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      )}
    </>
  )
}

export default UpsertModalForm
