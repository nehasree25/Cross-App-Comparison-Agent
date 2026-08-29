import { useEffect, useRef } from 'react'

export function CategoryTicker() {
  const tickerRef = useRef(null)

  const categories = [
    'Laptops',
    'Smartphones',
    'Running Shoes',
    'Office Chairs',
    'Headphones',
    'Monitors',
    'Tablets',
    'Accessories',
  ]

  useEffect(() => {
    const ticker = tickerRef.current
    if (!ticker) return

    // Clone items for seamless loop
    const items = ticker.querySelectorAll('.ticker-item')
    items.forEach(item => {
      const clone = item.cloneNode(true)
      ticker.appendChild(clone)
    })
  }, [])

  return (
    <section className="category-section" id="categories">
      <div className="container">
        <h2 className="category-heading">Compare Across Categories</h2>
        <p className="category-subtitle">
          Explore the product categories available across connected apps.
        </p>

        <div className="ticker-container">
          <div className="ticker-gradient ticker-gradient-left" />
          <div className="ticker-gradient ticker-gradient-right" />

          <div className="ticker" ref={tickerRef}>
            {categories.map((category, index) => (
              <button key={index} className="ticker-item">
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
