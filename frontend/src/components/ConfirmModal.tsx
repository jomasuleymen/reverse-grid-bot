import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Modal, ModalProps } from 'antd'
import React from 'react'

interface ConfirmModalProps {
  actionText: string

  onOk: () => Promise<any>
  okType: ModalProps['okType']
  okText: ModalProps['okText']

  modalTitle: string
  invalidateQueryKey?: string[]
  cancelText: string
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  actionText,
  modalTitle,
  onOk,
  invalidateQueryKey,
  okType,
  okText,
  cancelText,
}) => {
  const [openModal, setOpenModal] = React.useState(false)
  const queryClient = useQueryClient()

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      await onOk()
      setOpenModal(false)
    },
    onSuccess: () => {
      if (invalidateQueryKey) {
        queryClient.invalidateQueries({ queryKey: invalidateQueryKey })
      }
    },
  })

  const handleOk = async () => {
    mutate()
  }

  return (
    <>
      <Button danger type="link" onClick={() => setOpenModal(true)}>
        {actionText}
      </Button>
      {openModal && (
        <Modal
          title={modalTitle}
          open={true}
          onCancel={() => setOpenModal(false)}
          onOk={handleOk}
          centered={true}
          closeIcon={false}
          confirmLoading={isPending}
          okType={okType}
          okText={okText}
          cancelText={cancelText}
          cancelButtonProps={{ disabled: isPending }}
        />
      )}
    </>
  )
}

export default ConfirmModal
