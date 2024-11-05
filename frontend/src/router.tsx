import React, { Suspense } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { ErrorPage } from '@/pages/ErrorPage'
import Loading from './components/Loading'
import ProtectedRoute from './components/ProtectedRoute'
import ScreenLoading from './components/ScreenLoading'

const MainLayout = React.lazy(() => import('@/layout'))
const TradingBotConfigs = React.lazy(() => import('@/pages/bot-configs'))
const TradingBotAccounts = React.lazy(() => import('@/pages/exchange-credentials'))
const TradingBots = React.lazy(() => import('@/pages/trading-bots'))
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
    element: TradingBotConfigs,
  },
  {
    label: 'Аккаунты бирж',
    path: '/exchange-credentials',
    protected: true,
    element: TradingBotAccounts,
  },
  {
    label: 'Боты',
    path: '/bots',
    protected: true,
    element: TradingBots,
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
        <Suspense fallback={<ScreenLoading />}>
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
