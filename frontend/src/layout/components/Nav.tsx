import { Layout, Menu, MenuProps } from 'antd'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const { Header } = Layout

import { routes } from '@/router'
import { useAuthStore } from '@/store/auth.store'

type MenuItem = Required<MenuProps>['items'][number]

const normalizePath = (path: string) => path.replace(/\/+$/, '')

export const Nav: React.FC = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const logout = useAuthStore((store) => store.logout)

  const leftNavbarItems = useMemo(() => {
    const items: MenuItem[] = routes
      .filter((route) => route.label)
      .map((route) => ({
        key: normalizePath(route.path), // Normalize each key
        label: route.label,
        onClick: () => navigate(route.path),
      }))

    return items
  }, [])

  const rightNavbarItems = useMemo(() => {
    const items: MenuItem[] = [
      {
        key: 'logout',
        label: 'Выход',
        onClick: () => {
          logout()
        },
      },
    ]

    return items
  }, [])

  const selectedKeys = useMemo(() => [normalizePath(pathname)], [pathname])

  return (
    <Header className="flex px-0">
      <Menu
        className="flex-1"
        theme="dark"
        mode="horizontal"
        items={leftNavbarItems}
        selectedKeys={selectedKeys}
      />

      <Menu theme="dark" mode="horizontal" items={rightNavbarItems} selectedKeys={selectedKeys} />
    </Header>
  )
}
