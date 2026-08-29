import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { handleApiError, getGeneralError, getFieldError } from '../utils/errorHandler'
import './Auth.css'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = 'Username or email is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    // Clear API error when user starts typing
    if (apiError) {
      setApiError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setApiError(null)

    try {
      await login(formData.usernameOrEmail, formData.password)
      navigate('/dashboard')
    } catch (error) {
      // Convert API error to user-friendly message
      const errorInfo = handleApiError(error)
      setApiError(errorInfo)
      
      // Clear password field on authentication failure
      setFormData(prev => ({
        ...prev,
        password: ''
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <Link to="/" className="auth-logo">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
            <span>CrossCompare</span>
          </Link>

          {/* Heading */}
          <div className="auth-heading">
            <h1>Welcome Back</h1>
            <p>Sign in to continue comparing products across apps and find the best match.</p>
          </div>

          {/* General API Error */}
          {apiError && !apiError.field && (
            <div className="auth-error" role="alert">
              <AlertCircle size={16} />
              <span>{getGeneralError(apiError)}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username or Email */}
            <div className="form-group">
              <label htmlFor="usernameOrEmail" className="form-label">
                Username or Email
              </label>
              <input
                type="text"
                id="usernameOrEmail"
                name="usernameOrEmail"
                placeholder="Enter your username or email"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                className={`form-input ${errors.usernameOrEmail || getFieldError('usernameOrEmail', apiError) ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.usernameOrEmail && (
                <span className="form-error">{errors.usernameOrEmail}</span>
              )}
              {getFieldError('usernameOrEmail', apiError) && (
                <span className="form-error">{getFieldError('usernameOrEmail', apiError)}</span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password || getFieldError('password', apiError) ? 'error' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="form-error">{errors.password}</span>
              )}
              {getFieldError('password', apiError) && (
                <span className="form-error">{getFieldError('password', apiError)}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary-auth"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <span>Don't have an account?</span>
            <Link to="/signup" className="auth-link">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
