import { createRoot } from 'react-dom/client'

import { App } from '@/App'
import { getElementById } from '@/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import ruRu from 'antd/locale/ru_RU'

const rootElement = getElementById('root')

const app = createRoot(rootElement)

const queryClient = new QueryClient()

app.render(
  <ConfigProvider locale={ruRu}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ConfigProvider>,
)
