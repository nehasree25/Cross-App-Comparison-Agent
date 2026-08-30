/**
 * API Client utility that handles authenticated requests
 * Automatically handles 401 responses and token expiration
 */

let authContext = null

// Register the auth context so the API client can call handleTokenInvalid
export function initApiClient(authContextValue) {
  authContext = authContextValue
}

/**
 * Make an authenticated API request
 * Handles token expiration (401) by clearing auth state
 */
export async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('token')
  
  // Add Authorization header if token exists
  const headers = {
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  // Handle 401 - token invalid/expired
  if (response.status === 401) {
    if (authContext) {
      authContext.handleTokenInvalid()
      // Redirect to login by returning to home
      window.location.href = '/login'
    }
  }
  
  return response
}
