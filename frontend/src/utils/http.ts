import axios from 'axios'

export const API_URL = import.meta.env.VITE_SERVER_URL + '/api'

const defaultErrorData = {
  message: 'Произошла ошибка',
}

const $api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

$api.interceptors.response.use(
  (response) => response,
  (err) => {
    const errorData = err.response?.data || defaultErrorData
    return Promise.reject(errorData)
  },
)

export default $api
