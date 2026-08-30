import { useState } from 'react'
import { Zap } from 'lucide-react'
import { handleApiError, getGeneralError, getFieldError } from '../utils/errorHandler'
import './Compare.css'

const EXAMPLE_REQUIREMENTS = [
  'Laptop under ₹50,000',
  'Smartphone under ₹30,000',
  'Running shoes under ₹5,000',
  'Headphones under ₹10,000'
]

function BestMatchCard({ product }) {
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

      {product.availability !== undefined && (
        <p className="best-match-availability">
          {product.availability ? '✓ In Stock' : '✗ Out of Stock'}
        </p>
      )}
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
  const [requirement, setRequirement] = useState('')
  const [comparisonResults, setComparisonResults] = useState(null)
  const [agentMessage, setAgentMessage] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState(null)

  const handleExampleClick = (example) => {
    setRequirement(example)
    setApiError(null)
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
      setAgentMessage(data.message || '')
      setComparisonResults({
        recommended_product: data.recommended_product,
        products: data.products || []
      })
    } catch (error) {
      const errorInfo = handleApiError(error)
      setApiError(errorInfo)
      console.error('Error comparing products:', error)
    } finally {
      setIsLoading(false)
    }
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
              {comparisonResults.recommended_product && (
                <div className="best-match-container">
                  <BestMatchCard product={comparisonResults.recommended_product} />
                </div>
              )}

              {/* Comparison Results */}
              {comparisonResults.products.length > 0 && (
                <div className="all-results-section">
                  <div className="results-header">
                    <h2>Comparison Results</h2>
                    <span className="results-count">{comparisonResults.products.length} products</span>
                  </div>
                  <div className="results-grid">
                    {comparisonResults.products.slice(0, 8).map((product, idx) => (
                      <ComparisonProductCard
                        key={product.product_id || idx}
                        product={product}
                      />
                    ))}
                  </div>
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
