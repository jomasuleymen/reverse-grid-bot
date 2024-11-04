import $api from '@/utils/http'

export const AUTH_ENDPOINT = '/auth'

export type User = {
  _id: string
  username: string
  firstname: string
  isAdmin: boolean
  lastname: string
  sellerCode: string
  role: string
}

export type MessageResponse = {
  message: string
  success: boolean
}

export const login = async (username: string, password: string) => {
  const payload = {
    username,
    password,
  }

  return await $api.post<MessageResponse>(`${AUTH_ENDPOINT}/login`, payload).then((res) => res.data)
}

export const logout = async () => {
  return await $api
    .post(`${AUTH_ENDPOINT}/logout`)
    .then(() => {
      return {
        success: true,
      }
    })
    .catch((err) => {
      throw new Error(err?.data?.message || 'Невозможно выйти из аккаунта')
    })
}

export const fetchMe = async () => {
  return await $api
    .get<User>(`${AUTH_ENDPOINT}/me`)
    .then((res) => {
      return res.data
    })
    .catch((err) => {
      return null
    })
}
