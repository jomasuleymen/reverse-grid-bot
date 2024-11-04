import { MessageResponse } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Card, Form, Input } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface LoginProps {}

interface LoginFormData {
  username: string
  password: string
}

interface LoginError {
  message: string
}

const Login: React.FC<LoginProps> = () => {
  const login = useAuthStore((store) => store.login)
  const isAuthenticated = useAuthStore((store) => store.isAuthenticated)
  const navigate = useNavigate()
  const [passwordVisible, setPasswordVisible] = useState(false)

  // Handle authentication mutation
  const { mutate, isPending, isError, isSuccess, data, error } = useMutation<
    MessageResponse,
    LoginError,
    LoginFormData
  >({
    mutationFn: ({ username, password }) => login(username, password),
  })

  useEffect(() => {
    if (isAuthenticated) navigate('/')
  }, [isAuthenticated, navigate])

  const handleFormSubmit = (values: LoginFormData) => {
    mutate(values)
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-60 text-sm">
        <Form name="login" className="flex flex-col gap-2" onFinish={handleFormSubmit}>
          <Form.Item
            name="username"
            className="m-0"
            rules={[{ required: true, message: 'Введите логин' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Логин" className="text-sm" />
          </Form.Item>
          <Form.Item
            name="password"
            className="m-0"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Пароль"
              visibilityToggle={{
                visible: passwordVisible,
                onVisibleChange: setPasswordVisible,
              }}
            />
          </Form.Item>

          {/* Display success or error message */}
          {(isSuccess || isError) && (
            <Alert
              message={isSuccess ? data?.message : error?.message}
              type={isSuccess && data?.success ? 'success' : 'error'}
              style={{ fontSize: '12px' }}
            />
          )}

          <Form.Item className="m-0">
            <Button type="primary" htmlType="submit" className="w-full" loading={isPending}>
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login
