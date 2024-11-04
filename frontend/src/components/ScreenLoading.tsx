import React from 'react'

import { GlobalLoading } from 'react-global-loading'
import logo from '/assets/logo.svg?url'

const ScreenLoading: React.FC = () => {
  return (
    <GlobalLoading>
      <img src={logo} width={50} height={50} alt="logo" className="animate-bounce" />
    </GlobalLoading>
  )
}

export default ScreenLoading
