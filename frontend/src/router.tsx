import React, { Suspense } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { ErrorPage } from '@/pages/ErrorPage'
import Loading from './components/Loading'
import ProtectedRoute from './components/ProtectedRoute'

const MainLayout = React.lazy(() => import('@/layout'))
const TradingBotConfigs = React.lazy(() => import('@/pages/bot-configs'))
const TradingBotAccounts = React.lazy(() => import('@/pages/exchange-credentials'))
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
    label: 'Аккаунты бирж',
    path: '/exchange-credentials',
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
