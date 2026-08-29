import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    if (token) {
      // Verify token is valid by checking user info
      fetchCurrentUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Token invalid, clear it
        setToken(null)
        localStorage.removeItem('token')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setToken(null)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (usernameOrEmail, password) => {
    const formData = new URLSearchParams()
    formData.append('username', usernameOrEmail)
    formData.append('password', password)

    const response = await fetch('http://localhost:8000/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(errorData.detail || 'Login failed')
      error.response = {
        status: response.status,
        data: errorData
      }
      throw error
    }

    const data = await response.json()
    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('token', data.access_token)
    return data
  }

  const signup = async (username, email, name, password) => {
    const response = await fetch('http://localhost:8000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        email,
        name,
        password
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(errorData.detail || 'Failed to create account')
      error.response = {
        status: response.status,
        data: errorData
      }
      throw error
    }

    const data = await response.json()
    // After signup, auto-login
    try {
      await login(username, password)
    } catch (loginError) {
      // Signup succeeded, just redirect to login
      return data
    }
    return data
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
