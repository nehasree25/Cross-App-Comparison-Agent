import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  // While auth state is loading, don't redirect yet
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  // Check both the context token and localStorage as a fallback
  const hasToken = token || localStorage.getItem('token')

  // If no token, redirect to login
  if (!hasToken) {
    return <Navigate to="/login" replace />
  }

  // User is authenticated, render the component
  return children
}
