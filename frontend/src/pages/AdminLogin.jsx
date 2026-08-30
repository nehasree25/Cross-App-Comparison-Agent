import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminLogin.css'

export function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Clear user session when entering admin login
  useEffect(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username/email and password')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username_or_email: username,
          password: password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 403) {
          setError('You do not have administrator access')
        } else if (response.status === 401) {
          setError('Incorrect username/email or password')
        } else {
          setError(errorData.detail || 'Login failed. Please try again.')
        }
        return
      }

      const data = await response.json()
      
      // Store admin token and info
      localStorage.setItem('adminToken', data.access_token)
      localStorage.setItem('adminUser', JSON.stringify(data.admin))
      
      // Redirect to admin dashboard
      navigate('/admin')
    } catch (err) {
      console.error('Login error:', err)
      setError('Unable to connect to the server. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <h1>Admin Login</h1>
            <p>CrossApp Agent Administration</p>
          </div>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username or Email</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="form-input"
              />
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-admin-login"
              disabled={isLoading}
            >
              {isLoading ? 'Logging In...' : 'Login'}
            </button>
          </form>

          <div className="admin-login-footer">
            <p>Admin access only. Unauthorized access is prohibited.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
