import { Layout } from 'antd'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Main } from './components/Main'
import { Nav } from './components/Nav'

type Props = {}

const MainLayout: React.FC<Props> = () => {
  const location = useLocation()

  if (location.pathname === '/') {
    return <Navigate replace to="/configs" />
  }

  return (
    <Layout>
      <Nav />
      <Main children={<Outlet />} />
    </Layout>
  )
}

export default MainLayout
