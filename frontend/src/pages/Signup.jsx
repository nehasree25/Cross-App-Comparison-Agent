import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { handleApiError, getGeneralError, getFieldError } from '../utils/errorHandler'
import './Auth.css'

const PASSWORD_MIN_LENGTH = 8

function getPasswordStrength(password) {
  if (!password) return 0
  
  let strength = 0
  
  // Length check
  if (password.length >= PASSWORD_MIN_LENGTH) strength++
  if (password.length >= 12) strength++
  
  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password) || /[!@#$%^&*]/.test(password)) strength++
  
  return Math.min(4, strength)
}

function getStrengthLabel(strength) {
  if (strength === 0) return ''
  if (strength === 1) return 'Weak'
  if (strength === 2) return 'Fair'
  if (strength === 3) return 'Good'
  return 'Strong'
}

export function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
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
    
    // Update password strength
    if (name === 'password') {
      setPasswordStrength(getPasswordStrength(value))
    }
    
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
      await signup(
        formData.username,
        formData.email,
        formData.name,
        formData.password
      )
      navigate('/dashboard')
    } catch (error) {
      // Convert API error to user-friendly message
      const errorInfo = handleApiError(error)
      setApiError(errorInfo)
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength(formData.password)
  const strengthLabel = getStrengthLabel(strength)

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
            <h1>Create Your Account</h1>
            <p>Create an account to compare products across apps and find the best option for your needs.</p>
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
            {/* Username */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                className={`form-input ${errors.username || getFieldError('username', apiError) ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.username && (
                <span className="form-error">{errors.username}</span>
              )}
              {getFieldError('username', apiError) && (
                <span className="form-error">{getFieldError('username', apiError)}</span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email || getFieldError('email', apiError) ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.email && (
                <span className="form-error">{errors.email}</span>
              )}
              {getFieldError('email', apiError) && (
                <span className="form-error">{getFieldError('email', apiError)}</span>
              )}
            </div>

            {/* Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                className={`form-input ${errors.name || getFieldError('name', apiError) ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.name && (
                <span className="form-error">{errors.name}</span>
              )}
              {getFieldError('name', apiError) && (
                <span className="form-error">{getFieldError('name', apiError)}</span>
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
                  placeholder="Create a password"
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`strength-bar ${i <= strength ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                  {strengthLabel && (
                    <span className={`strength-label strength-${strengthLabel.toLowerCase()}`}>
                      {strengthLabel}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary-auth"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
