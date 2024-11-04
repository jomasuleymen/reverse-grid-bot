import { Divider } from 'antd'
import React, { memo } from 'react'

import { cn } from '@/utils/tailwind.util'
import './block.style.scss'

interface BlockProps {
  title?: string
  children: React.ReactNode
  transparency?: boolean
  className?: string
}

const Block: React.FC<BlockProps> = ({ title, children, transparency, className }) => {
  const localClass = transparency ? 'block transparent' : 'block'

  return (
    <div className={cn(localClass, 'max-w-3xl', className)}>
      {title && (
        <Divider
          style={{
            margin: '5px 0',
          }}
        >
          {title}
        </Divider>
      )}
      {children}
    </div>
  )
}

export default memo(Block)
