import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight } from 'lucide-react'
import './Dashboard.css'

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleStartComparing = () => {
    navigate('/compare')
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <h1>Welcome back, {user?.name || user?.username}!</h1>
          <p>Ready to find the best products across all your favorite apps?</p>
        </div>

        {/* Primary CTA */}
        <div className="dashboard-cta">
          <button className="btn-start-comparing" onClick={handleStartComparing}>
            Start Comparing
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Recent Comparisons */}
          <section className="dashboard-section">
            <h2>Recent Comparisons</h2>
            <div className="section-content">
              <p className="empty-state">No comparisons yet. Start comparing products to get recommendations!</p>
            </div>
          </section>

          {/* Recent Recommendations */}
          <section className="dashboard-section">
            <h2>Recent Recommendations</h2>
            <div className="section-content">
              <p className="empty-state">Your AI-powered recommendations will appear here.</p>
            </div>
          </section>

          {/* Recent Orders */}
          <section className="dashboard-section">
            <h2>Recent Orders</h2>
            <div className="section-content">
              <p className="empty-state">Your orders will appear here.</p>
            </div>
          </section>
        </div>

        {/* Info Section */}
        <div className="dashboard-info">
          <h2>How It Works</h2>
          <div className="info-steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Compare Products</h3>
              <p>Search and compare products across multiple apps</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Get Recommendations</h3>
              <p>Receive AI-powered recommendations based on your preferences</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Make Your Choice</h3>
              <p>Find the best match and complete your order</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
