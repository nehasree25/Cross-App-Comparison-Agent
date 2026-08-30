import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function AdminProtectedRoute({ children }) {
  const navigate = useNavigate()
  const [isAuthorized, setIsAuthorized] = useState(null)

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    
    if (!adminToken) {
      navigate('/admin/login')
      setIsAuthorized(false)
    } else {
      setIsAuthorized(true)
    }
  }, [navigate])

  // Show loading state while checking auth
  if (isAuthorized === null) {
    return null
  }

  if (!isAuthorized) {
    return null
  }

  return children
}
