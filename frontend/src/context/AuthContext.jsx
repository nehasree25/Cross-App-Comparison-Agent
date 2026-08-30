import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Get token from localStorage
      const storedToken = localStorage.getItem('token')
      
      if (storedToken) {
        // Verify token is valid by checking user info
        const response = await fetch('http://localhost:8000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        })
        
        if (response.ok) {
          const userData = await response.json()
          setToken(storedToken)
          setUser(userData)
        } else {
          // Token invalid/expired, clear it
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      } else {
        // No stored token
        setToken(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
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
    const accessToken = data.access_token
    
    // Store token in localStorage FIRST (synchronously)
    localStorage.setItem('token', accessToken)
    
    // Then update state (may be async)
    setToken(accessToken)
    setUser(data.user)
    
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
    // Clear state
    setUser(null)
    setToken(null)
    
    // Clear localStorage
    localStorage.removeItem('token')
  }

  const handleTokenInvalid = () => {
    // Called when backend returns 401 (token expired/invalid)
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, handleTokenInvalid }}>
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
