import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd';
import { ColumnsType, TableProps } from 'antd/es/table';
import { memo, useEffect, useState } from 'react';

interface DataTableProps<Response, DataType> {
	queryKey: string[];
	columns: ColumnsType<DataType>;
	fetchData: () => Promise<Response>;
	parseDataSource: (data: Response) => DataType[];
	tableProps?: TableProps<DataType>;
}

function DataTable({
	queryKey,
	fetchData,
	parseDataSource,
	columns,
	tableProps = {},
}: DataTableProps<any, any>) {
	const { isPending, isSuccess, data } = useQuery<Response>({
		queryKey,
		queryFn: () => fetchData(),
		refetchOnWindowFocus: false,
	});

	const [dataSource, setDataSource] = useState<any[]>([]);

	useEffect(() => {
		if (isSuccess && data) {
			setDataSource(parseDataSource(data));
		}
	}, [isSuccess, data]);

	return (
		<Table
			loading={isPending}
			columns={columns}
			dataSource={dataSource}
			pagination={false}
			bordered={true}
			scroll={{ x: 'max-content' }}
			{...tableProps}
		/>
	);
}

export default memo(DataTable);
