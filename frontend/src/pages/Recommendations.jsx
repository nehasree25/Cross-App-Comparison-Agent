import { Lightbulb } from 'lucide-react'
import './Recommendations.css'

export function Recommendations() {
  // TODO: Connect to actual recommendations API
  const recommendations = []

  return (
    <div className="recommendations-page">
      <div className="recommendations-container">
        {/* Header */}
        <div className="recommendations-header">
          <h1>AI Recommendations</h1>
          <p>Personalized product recommendations based on your search history and preferences</p>
        </div>

        {/* Content */}
        {recommendations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Lightbulb size={48} />
            </div>
            <h2>No Recommendations Yet</h2>
            <p>Start comparing products to receive AI-powered recommendations tailored to your preferences</p>
            <a href="/compare" className="btn-start-comparing">
              Start Comparing
            </a>
          </div>
        ) : (
          <div className="recommendations-grid">
            {/* Recommendations will be rendered here */}
          </div>
        )}
      </div>
    </div>
  )
}
