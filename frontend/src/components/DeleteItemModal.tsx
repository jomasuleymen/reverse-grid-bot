import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal } from 'antd';
import React from 'react';

interface DeleteItemModalProps {
	onDelete: () => Promise<any>;
	modalTitle: string;
	invalidateQueryKey?: string[];
}

const DeleteItemModal: React.FC<DeleteItemModalProps> = ({
	modalTitle,
	onDelete,
	invalidateQueryKey,
}) => {
	const [openModal, setOpenModal] = React.useState(false);
	const queryClient = useQueryClient();

	const { isPending, mutate } = useMutation({
		mutationFn: async () => {
			return await onDelete();
		},
		onSuccess: () => {
			if (invalidateQueryKey) {
				queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
			}
		},
	});

	const handleOk = async () => {
		mutate();
		setOpenModal(false);
	};

	return (
		<>
			<Button danger type="link" onClick={() => setOpenModal(true)}>
				Удалить
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
					okType="danger"
					okText="Удалить"
					cancelText="Отмена"
				/>
			)}
		</>
	);
};

export default DeleteItemModal;
