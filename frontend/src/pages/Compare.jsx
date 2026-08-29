import { useState } from 'react'
import { Search } from 'lucide-react'
import './Compare.css'

export function Compare() {
  const [searchQuery, setSearchQuery] = useState('')
  const [comparisonResults, setComparisonResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) {
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      // TODO: Connect to actual comparison API
      // For now, show empty state
      setComparisonResults([])
    } catch (error) {
      console.error('Error fetching comparison:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="compare-page">
      <div className="compare-container">
        {/* Header */}
        <div className="compare-header">
          <h1>Compare Products</h1>
          <p>Search for products across multiple apps and find the best match</p>
        </div>

        {/* Search Form */}
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search for a product (e.g., iPhone 15, laptop, headphones)"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="search-button" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Results */}
        <div className="compare-results">
          {!hasSearched ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Search size={48} />
              </div>
              <h2>Start Comparing</h2>
              <p>Enter a product name above to compare prices and features across apps</p>
            </div>
          ) : isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Finding the best deals...</p>
            </div>
          ) : comparisonResults.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Search size={48} />
              </div>
              <h2>No Results Found</h2>
              <p>Try searching for a different product</p>
            </div>
          ) : (
            <div className="results-grid">
              {/* Results will be rendered here */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
