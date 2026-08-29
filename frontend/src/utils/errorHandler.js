/**
 * Error handler utility for converting API errors into user-friendly messages
 * and field-specific errors.
 */

// Field name mapping
const FIELD_NAME_MAP = {
  username: 'Username',
  email: 'Email',
  name: 'Name',
  password: 'Password',
  username_or_email: 'Username or Email',
  confirm_password: 'Confirm Password',
}

// Message mapping for common validation errors
const VALIDATION_MESSAGE_MAP = {
  'Field required': 'This field is required.',
  'value is not a valid email address': 'Please enter a valid email address.',
  'ensure this value has at least 3 characters': 'Must be at least 3 characters.',
  'ensure this value has at least 8 characters': 'Must be at least 8 characters.',
  'string_type': 'Please enter valid text.',
  'string_too_short': 'This field is too short.',
  'string_too_long': 'This field is too long.',
  'value_error': 'This value is not valid.',
}

/**
 * Parse FastAPI validation error response
 * Handles array of validation errors and returns the first one
 */
function parseFastAPIValidationError(details) {
  if (!Array.isArray(details)) {
    return null
  }

  for (const error of details) {
    if (error.loc && error.msg) {
      const field = error.loc[error.loc.length - 1]
      const msg = error.msg || ''
      
      // Map field name to user-friendly name
      const fieldLabel = FIELD_NAME_MAP[field] || field
      
      // Try to map the error message
      let userMessage = VALIDATION_MESSAGE_MAP[msg] || msg
      
      // Handle specific cases
      if (msg.includes('ensure this value has at least')) {
        const match = msg.match(/at least (\d+) characters/)
        if (match) {
          userMessage = `Must be at least ${match[1]} characters.`
        }
      }
      
      return {
        field: field,
        message: userMessage,
        fieldLabel: fieldLabel,
      }
    }
  }

  return null
}

/**
 * Handle API errors and convert to user-friendly messages
 * Returns: { message: string, field?: string, fieldLabel?: string }
 */
export function handleApiError(error) {
  // Network error - no response
  if (!error.response) {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return {
        message: 'Unable to connect to the server. Please check your connection and try again.',
      }
    }
    
    return {
      message: 'Unable to connect to the server. Please try again.',
    }
  }

  const status = error.response.status
  const data = error.response.data

  // Handle specific field errors from backend
  if (status === 409 && data.detail) {
    const detail = data.detail.toLowerCase()
    
    if (detail.includes('username')) {
      return {
        message: 'This username is already taken. Please choose another.',
        field: 'username',
      }
    }
    
    if (detail.includes('email')) {
      return {
        message: 'An account with this email already exists.',
        field: 'email',
      }
    }
    
    return {
      message: 'This account information is already in use.',
    }
  }

  // Handle FastAPI validation errors (422)
  if (status === 422 && data.detail) {
    // If detail is an array (FastAPI validation errors)
    if (Array.isArray(data.detail)) {
      const validationError = parseFastAPIValidationError(data.detail)
      if (validationError) {
        return {
          message: validationError.message,
          field: validationError.field,
          fieldLabel: validationError.fieldLabel,
        }
      }
    }
    
    // If detail is a string
    if (typeof data.detail === 'string') {
      return {
        message: data.detail,
      }
    }
  }

  // Handle authentication errors
  if (status === 401) {
    return {
      message: 'Invalid username/email or password.',
    }
  }

  // Handle authorization errors
  if (status === 403) {
    return {
      message: 'You are not authorized to perform this action.',
    }
  }

  // Handle not found errors
  if (status === 404) {
    return {
      message: 'The requested service could not be found.',
    }
  }

  // Handle bad request errors
  if (status === 400) {
    if (data.detail) {
      return {
        message: typeof data.detail === 'string' 
          ? data.detail 
          : 'The request could not be processed. Please check your information.',
      }
    }
    
    return {
      message: 'The request could not be processed. Please check your information.',
    }
  }

  // Handle rate limiting
  if (status === 429) {
    return {
      message: 'Too many attempts. Please wait a moment and try again.',
    }
  }

  // Handle server errors
  if (status >= 500 && status < 600) {
    if (status === 503 || status === 504 || status === 502) {
      return {
        message: 'The server is temporarily unavailable. Please try again later.',
      }
    }
    
    return {
      message: 'Something went wrong on our server. Please try again later.',
    }
  }

  // Generic error fallback
  return {
    message: 'Something went wrong. Please try again.',
  }
}

/**
 * Format field-specific error message
 * Used for displaying errors below individual form fields
 */
export function getFieldError(field, error) {
  if (!error) return null
  
  // If error has a specific field
  if (error.field === field) {
    return error.message
  }
  
  return null
}

/**
 * Get general error message (for errors not tied to a specific field)
 * Used for displaying general form errors
 */
export function getGeneralError(error) {
  if (!error) return null
  
  // If error has no specific field, it's a general error
  if (!error.field) {
    return error.message
  }
  
  return null
}
