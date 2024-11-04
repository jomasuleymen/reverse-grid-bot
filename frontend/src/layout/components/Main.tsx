import { Layout } from 'antd'

const { Content } = Layout

export const Main: React.FC<React.PropsWithChildren> = (props) => {
  const { children } = props

  return <Content className='pt-2 px-2'>{children}</Content>
}
