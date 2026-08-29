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

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // User is authenticated, render the component
  return children
}
