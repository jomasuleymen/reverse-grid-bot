import { useCallback, useLayoutEffect, useRef } from 'react'

const useClickOutSide = <T extends HTMLElement>(inSide?: () => void, outSide?: () => void) => {
  const inSideRef = useRef(inSide)
  const outSideRef = useRef(outSide)
  const targetRef = useRef<T | null>(null)

  const handleGlobalClick = useCallback(
    ({ clientX, clientY }: MouseEvent) => {
      if (!targetRef.current?.getBoundingClientRect) return

      const { right, left, bottom, top } = targetRef.current.getBoundingClientRect()

      if (clientX > right || clientX < left || clientY > bottom || clientY < top) {
        outSideRef.current?.()
      } else {
        inSideRef.current?.()
      }
    },
    [inSideRef, outSideRef],
  )

  useLayoutEffect(() => {
    window.addEventListener('click', handleGlobalClick)
    return () => {
      window.removeEventListener('click', handleGlobalClick)
    }
  }, [handleGlobalClick])

  return targetRef
}

export { useClickOutSide }
