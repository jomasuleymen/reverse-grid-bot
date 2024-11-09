import { useQuery } from '@tanstack/react-query'
import { Table } from 'antd'
import { ColumnsType, TableProps } from 'antd/es/table'
import { memo, useEffect, useState } from 'react'

interface DataTableProps<Response, DataType> {
  queryKey: string[]
  columns: ColumnsType<DataType>
  fetchData: () => Promise<Response>
  parseDataSource: (data: Response) => DataType[]
  tableProps?: TableProps<DataType>
  refetchInterval?: number
  shouldRefetch?: (data: Response) => boolean
  refetchOnWindowFocus?: boolean
}

function DataTable({
  queryKey,
  fetchData,
  parseDataSource,
  columns,
  refetchInterval,
  shouldRefetch,
  refetchOnWindowFocus,
  tableProps = {},
}: DataTableProps<any, any>) {
  const { isPending, isSuccess, data } = useQuery<Response>({
    queryKey,
    queryFn: () => fetchData(),
    refetchOnWindowFocus: refetchOnWindowFocus || false,
    refetchInterval: (query): number | false | undefined => {
      if (!shouldRefetch) return false

      return shouldRefetch(query.state.data) ? refetchInterval : false
    },
  })

  const [dataSource, setDataSource] = useState<any[]>([])

  useEffect(() => {
    if (isSuccess && data) {
      setDataSource(parseDataSource(data))
    }
  }, [isSuccess, data])

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
  )
}

export default memo(DataTable)
