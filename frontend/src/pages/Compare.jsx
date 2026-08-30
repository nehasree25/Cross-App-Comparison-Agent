import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { handleApiError, getGeneralError } from '../utils/errorHandler'
import './Compare.css'

const EXAMPLE_REQUIREMENTS = [
  'Laptop under ₹50,000',
  'Smartphone under ₹30,000',
  'Running shoes under ₹5,000',
  'Headphones under ₹10,000'
]

function BestMatchCard({ product, onOrder, isOrdering, orderError }) {
  return (
    <div className="best-match-card">
      <div className="best-match-badge">
        <Zap size={13} />
        <span>Best Match</span>
      </div>
      
      <h3 className="best-match-name">{product.name}</h3>
      
      {product.brand && (
        <p className="best-match-brand">{product.brand}</p>
      )}

      <div className="best-match-details">
        <span className="merchant-badge">{product.merchant}</span>
        
        {(product.price !== undefined || product.final_price !== undefined) && (
          <span className="best-match-price">
            ₹{parseFloat(product.final_price || product.price).toLocaleString()}
          </span>
        )}

        {product.rating !== undefined && (
          <span className="best-match-rating">
            ⭐ {parseFloat(product.rating).toFixed(1)}
          </span>
        )}
      </div>

      {product.delivery_days !== undefined && (
        <p className="best-match-delivery">
          🚚 {product.delivery_days} days delivery
        </p>
      )}

      {product.availability !== undefined && (
        <p className="best-match-availability">
          {product.availability ? '✓ In Stock' : '✗ Out of Stock'}
        </p>
      )}

      {orderError && (
        <div className="best-match-error" role="alert">
          <span>{orderError}</span>
        </div>
      )}

      <button
        className="btn-order-best-match"
        onClick={() => onOrder(product)}
        disabled={isOrdering}
      >
        {isOrdering ? 'Placing Order...' : 'Order Now'}
      </button>
    </div>
  )
}

function ComparisonProductCard({ product }) {
  return (
    <div className="comparison-product-card">
      <div className="card-header">
        <h3 className="card-product-name">{product.name}</h3>
        {product.brand && (
          <p className="card-brand">{product.brand}</p>
        )}
      </div>

      <div className="card-merchant">
        {product.merchant}
      </div>

      <div className="card-main-info">
        {(product.price !== undefined || product.final_price !== undefined) && (
          <div className="card-price-row">
            <span className="card-final-price">
              ₹{parseFloat(product.final_price || product.price).toLocaleString()}
            </span>
            {product.discount_percent && parseFloat(product.discount_percent) > 0 && (
              <span className="card-discount">{Math.round(product.discount_percent)}%</span>
            )}
          </div>
        )}

        {product.rating !== undefined && (
          <div className="card-rating">
            ⭐ {parseFloat(product.rating).toFixed(1)}
            {product.review_count !== undefined && (
              <span className="card-reviews">({product.review_count})</span>
            )}
          </div>
        )}
      </div>

      <div className="card-meta">
        {product.delivery_days !== undefined && (
          <span className="card-delivery">
            🚚 {product.delivery_days}d
          </span>
        )}
        {product.availability !== undefined && (
          <span className={`card-availability ${product.availability ? 'in-stock' : 'out-of-stock'}`}>
            {product.availability ? 'In Stock' : 'Out'}
          </span>
        )}
      </div>
    </div>
  )
}

export function Compare() {
  const navigate = useNavigate()
  const [requirement, setRequirement] = useState('')
  const [comparisonResults, setComparisonResults] = useState(null)
  const [agentMessage, setAgentMessage] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [orderError, setOrderError] = useState(null)
  const [comparisonPage, setComparisonPage] = useState(1)
  
  const PRODUCTS_PER_PAGE = 8

  const handleExampleClick = (example) => {
    setRequirement(example)
    setApiError(null)
  }

  const handleOrder = async (product) => {
    // Validate product_id
    if (!product || !product.product_id) {
      setOrderError('Unable to place the order because the product information is incomplete.')
      return
    }

    console.log('Order Debug - Recommended product:', product)
    console.log('Order Debug - Product ID being sent:', product.product_id)

    setIsOrdering(true)
    setOrderError(null)
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const requestBody = {
        product_id: product.product_id
      }
      
      console.log('Order Debug - Request body:', requestBody)
      
      const response = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Order Debug - Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.log('Order Debug - Error response:', errorData)
        
        // Create enhanced error with status code
        const error = new Error(errorData.detail || 'Failed to create order')
        error.response = {
          status: response.status,
          data: errorData
        }
        throw error
      }

      const responseData = await response.json()
      console.log('Order Debug - Success response:', responseData)
      
      // Order created successfully, navigate to orders page
      navigate('/orders')
    } catch (error) {
      console.error('Order Debug - Full error object:', error)
      
      // Handle specific error scenarios
      let errorMessage
      
      if (error.response?.status === 404) {
        errorMessage = 'Product not found. Please try another product.'
      } else if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Invalid product information. Please try another product.'
      } else if (error.response?.status === 422) {
        // Unprocessable entity - validation error
        const detail = error.response.data?.detail
        if (Array.isArray(detail) && detail.length > 0) {
          errorMessage = detail[0].msg || 'There was a problem with the order information.'
        } else if (typeof detail === 'string') {
          errorMessage = detail
        } else {
          errorMessage = 'Please check the product information and try again.'
        }
      } else if (error.response?.status >= 500) {
        errorMessage = 'Unable to create the order right now. Please try again.'
      } else if (!error.response) {
        errorMessage = 'Unable to connect to the server. Please check your connection and try again.'
      } else {
        errorMessage = error.message || 'Failed to create order. Please try again.'
      }
      
      setOrderError(errorMessage)
    } finally {
      setIsOrdering(false)
    }
  }

  const handleCompare = async (e) => {
    e.preventDefault()

    const trimmedRequirement = requirement.trim()
    
    if (!trimmedRequirement) {
      setApiError({ message: 'Please tell us what you\'re looking for.' })
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    setApiError(null)
    setComparisonResults(null)
    setAgentMessage('')

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('http://localhost:8000/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: trimmedRequirement
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(errorData.detail || 'Failed to compare products')
        error.response = {
          status: response.status,
          data: errorData
        }
        throw error
      }

      const data = await response.json()
      console.log('API Response:', data)
      console.log('Recommended Product:', data.recommended_product)
      console.log('Products:', data.products)
      
      setAgentMessage(data.message || '')
      setComparisonResults({
        recommended_product: data.recommended_product,
        products: data.products || []
      })
      // Reset pagination when new comparison results arrive
      setComparisonPage(1)
    } catch (error) {
      const errorInfo = handleApiError(error)
      setApiError(errorInfo)
      console.error('Error comparing products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Pagination helpers
  const getPaginatedProducts = () => {
    if (!comparisonResults || !comparisonResults.products) {
      return { products: [], totalPages: 0, startIndex: 0, endIndex: 0 }
    }
    
    const products = comparisonResults.products
    const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE)
    const startIndex = (comparisonPage - 1) * PRODUCTS_PER_PAGE
    const endIndex = startIndex + PRODUCTS_PER_PAGE
    
    return {
      products: products.slice(startIndex, endIndex),
      totalPages,
      startIndex,
      endIndex,
      total: products.length
    }
  }

  const handlePreviousPage = () => {
    setComparisonPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    const { totalPages } = getPaginatedProducts()
    setComparisonPage(prev => Math.min(totalPages, prev + 1))
  }

  const handlePageClick = (pageNum) => {
    setComparisonPage(pageNum)
  }

  return (
    <div className="compare-page">
      <div className="compare-container">
        {/* Header */}
        <div className="compare-header">
          <h1>Compare Across Apps</h1>
          <p>Tell us what you're looking for, and our AI will compare products across connected apps to find the best match.</p>
        </div>

        {/* Requirement Input Form */}
        <form className="requirement-form" onSubmit={handleCompare}>
          {/* Textarea */}
          <div className="input-group">
            <label htmlFor="requirement" className="input-label">
              What are you looking for?
            </label>
            <textarea
              id="requirement"
              placeholder="Example: Laptop under ₹50,000 with a rating above 4.5"
              className="requirement-textarea"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </div>

          {/* Example Requirements */}
          <div className="examples-section">
            <p className="examples-label">Quick examples:</p>
            <div className="examples-grid">
              {EXAMPLE_REQUIREMENTS.map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="example-button"
                  onClick={() => handleExampleClick(example)}
                  disabled={isLoading}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {apiError && !apiError.field && (
            <div className="compare-error" role="alert">
              <span>{getGeneralError(apiError)}</span>
            </div>
          )}

          {/* Compare Button */}
          <button
            type="submit"
            className="btn-compare"
            disabled={isLoading}
          >
            {isLoading ? 'Comparing Products...' : 'Compare Products'}
          </button>
        </form>

        {/* Results Section */}
        <div className="compare-results">
          {!hasSearched ? (
            <div className="empty-state">
              <p>Compare products across your connected apps</p>
              <p className="empty-subtitle">Describe what you're looking for above to get started.</p>
            </div>
          ) : isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Comparing products across apps...</p>
            </div>
          ) : comparisonResults && (comparisonResults.products.length > 0 || comparisonResults.recommended_product) ? (
            <>
              {/* Best Match Product */}
              {comparisonResults.recommended_product ? (
                <div className="best-match-container">
                  <BestMatchCard
                    product={comparisonResults.recommended_product}
                    onOrder={handleOrder}
                    isOrdering={isOrdering}
                    orderError={orderError}
                  />
                </div>
              ) : null}

              {/* Comparison Results */}
              {comparisonResults.products.length > 0 && (
                <div className="all-results-section">
                  <div className="results-header">
                    <h2>Comparison Results</h2>
                    <span className="results-count">{comparisonResults.products.length} products</span>
                  </div>
                  <div className="results-grid">
                    {getPaginatedProducts().products.map((product, idx) => (
                      <ComparisonProductCard
                        key={product.product_id || idx}
                        product={product}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {(() => {
                    const { totalPages, total, startIndex, endIndex } = getPaginatedProducts()
                    if (totalPages <= 1) return null
                    
                    const pageNumbers = []
                    for (let i = 1; i <= totalPages; i++) {
                      pageNumbers.push(i)
                    }
                    
                    return (
                      <div className="pagination-section">
                        <p className="pagination-info">
                          Showing {startIndex + 1}–{Math.min(endIndex, total)} of {total} products
                        </p>
                        
                        <div className="pagination-controls">
                          <button
                            className="btn-pagination-prev"
                            onClick={handlePreviousPage}
                            disabled={comparisonPage === 1}
                          >
                            ← Previous
                          </button>
                          
                          <div className="pagination-pages">
                            {pageNumbers.map(pageNum => (
                              <button
                                key={pageNum}
                                className={`pagination-page ${comparisonPage === pageNum ? 'active' : ''}`}
                                onClick={() => handlePageClick(pageNum)}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>
                          
                          <button
                            className="btn-pagination-next"
                            onClick={handleNextPage}
                            disabled={comparisonPage === totalPages}
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </>
          ) : (
            <div className="empty-results">
              <p>No products found for your requirement.</p>
              <p className="empty-subtitle">Try refining your search or try a different product category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
