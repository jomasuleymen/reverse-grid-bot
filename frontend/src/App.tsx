import '@/styles/global.scss'

import ScreenLoading from './components/ScreenLoading'
import { Router } from './router'

export const App: React.FC = () => {
  return (
    <>
      <ScreenLoading />
      <Router />
    </>
  )
}
