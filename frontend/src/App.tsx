import '@/styles/global.scss'

import { useEffect } from 'react'
import ScreenLoading from './components/ScreenLoading'
import { Router } from './router'
import { useAuthStore } from './store/auth.store'

export const App: React.FC = () => {
  const checkAuth = useAuthStore((store) => store.checkAuth)
  const isAuthChecked = useAuthStore((store) => store.isAuthChecked)

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <>
      <ScreenLoading />
      {isAuthChecked && <Router />}
    </>
  )
}
