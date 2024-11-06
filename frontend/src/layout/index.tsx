import { Layout } from 'antd'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/auth.store'
import { useEffect } from 'react'
import { Main } from './components/Main'
import { Nav } from './components/Nav'

type Props = {}

const MainLayout: React.FC<Props> = () => {
  const location = useLocation()
  const checkAuth = useAuthStore((store) => store.checkAuth)
  const isAuthChecked = useAuthStore((store) => store.isAuthChecked)

  useEffect(() => {
    checkAuth()
  }, [])

  if (location.pathname === '/') {
    return <Navigate replace to="/configs" />
  }

  return (
    isAuthChecked && (
      <Layout>
        <Nav />
        <Main children={<Outlet />} />
      </Layout>
    )
  )
}

export default MainLayout
