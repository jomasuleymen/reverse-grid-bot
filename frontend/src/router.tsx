import React, { Suspense } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { ErrorPage } from '@/pages/ErrorPage'
import ProtectedRoute from './components/ProtectedRoute'
import Loading from './components/Loading'

const MainLayout = React.lazy(() => import('@/layout'))
const TradingBotConfigs = React.lazy(() => import('@/pages/trading-bot/configs'))
const TradingBotAccounts = React.lazy(() => import('@/pages/trading-bot/accounts'))
const LoginPage = React.lazy(() => import('@/pages/login'))

type Route = {
  label?: string
  path: string
  protected?: boolean
  element: React.LazyExoticComponent<React.FC>
}

export const routes: Route[] = [
  {
    label: 'Конфигурации',
    path: '/configs',
    protected: true,
    element: TradingBotConfigs, // Use extracted variable
  },
  {
    label: 'Аккаунты',
    path: '/accounts',
    protected: true,
    element: TradingBotAccounts, // Use extracted variable
  },
]

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: routes.map((route) => ({
      path: route.path,
      element: (
        <Suspense fallback={<h1>Загрузка...</h1>}>
          {route.protected ? (
            <ProtectedRoute>
              <route.element />
            </ProtectedRoute>
          ) : (
            <route.element />
          )}
        </Suspense>
      ),
    })),
  },
])

export const Router = () => {
  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
