import { useAuthStore } from '@/store/auth.store'
import React from 'react'
import { Navigate } from 'react-router-dom'

const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute
