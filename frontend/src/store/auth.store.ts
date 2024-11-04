import { User, fetchMe, login, logout } from '@/services/auth.service'
import { globalLoading } from 'react-global-loading'
import { create } from 'zustand'

type UserStore = {
  user: User | null
  isAuthenticated: boolean
  isAuthChecked: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<any>
  logout: () => Promise<void>
  checkAuth: () => Promise<any>
}

export const useAuthStore = create<UserStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAuthChecked: false,
  loading: true,

  async login(username: string, password: string) {
    const res = await login(username, password)
    set({ isAuthenticated: true })
    return res
  },

  async logout() {
    set({ loading: true })

    await logout()
    set({ user: null, isAuthenticated: false, loading: false })
  },

  async checkAuth() {
    set({ loading: true })

    globalLoading.show()

    const user = await fetchMe()
    set({ user, isAuthenticated: !!user, loading: false, isAuthChecked: true })

    globalLoading.hide()
  },
}))
