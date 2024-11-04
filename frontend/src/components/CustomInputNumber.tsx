import { InputNumber } from 'antd';
import React from 'react';

interface CustomInputNumberProps extends React.ComponentProps<typeof InputNumber> {}

const formatter = (value: any) => value?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const parser = (value: any) => value?.replace(/\s+/g, '');

const CustomInputNumber: React.FC<CustomInputNumberProps> = (props = {}) => {
	return (
		<InputNumber
			style={{ width: '100%' }}
			controls={false}
			inputMode="numeric"
			formatter={formatter}
			parser={parser}
			{...props}
		/>
	);
};

export default CustomInputNumber;
