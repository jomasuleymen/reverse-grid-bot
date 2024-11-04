import React, { memo } from 'react';
import { Divider } from 'antd';

import './block.style.scss';

interface BlockProps {
	title?: string;
	children: React.ReactNode;
	transparency?: boolean;
}

const Block: React.FC<BlockProps> = ({ title, children, transparency }) => {
	const className = transparency ? 'block transparent' : 'block';

	return (
		<div className={className}>
			{title && (
				<Divider
					style={{
						margin: '5px 0',
					}}
				>
					{title}
				</Divider>
			)}
			{children}
		</div>
	);
};

export default memo(Block);
