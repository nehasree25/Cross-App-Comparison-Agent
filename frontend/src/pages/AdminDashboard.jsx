import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminNavbar } from '../components/AdminNavbar'
import { RevenueChart } from '../components/RevenueChart'
import './AdminDashboard.css'

export function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRevenueLoading, setIsRevenueLoading] = useState(true)
  const [error, setError] = useState(null)
  const [revenueError, setRevenueError] = useState(null)

  useEffect(() => {
    fetchStats()
    fetchRevenueData()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('adminToken')
      
      console.log('AdminDashboard - Token:', token ? 'exists' : 'missing')
      
      if (!token) {
        console.log('AdminDashboard - No token, redirecting to login')
        navigate('/admin/login')
        return
      }

      console.log('AdminDashboard - Fetching stats with token')
      const response = await fetch('http://localhost:8000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('AdminDashboard - Response status:', response.status)

      if (!response.ok) {
        if (response.status === 403) {
          console.log('AdminDashboard - 403 Forbidden, redirecting to login')
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
          navigate('/admin/login')
          return
        }
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      console.log('AdminDashboard - Stats received:', data)
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRevenueData = async () => {
    try {
      setIsRevenueLoading(true)
      const token = localStorage.getItem('adminToken')
      
      if (!token) {
        return
      }

      const response = await fetch('http://localhost:8000/api/admin/analytics/revenue?days=7', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 403) {
          return
        }
        throw new Error('Failed to fetch revenue data')
      }

      const data = await response.json()
      setRevenueData(data.days || [])
    } catch (err) {
      console.error('Error fetching revenue data:', err)
      setRevenueError(err.message)
    } finally {
      setIsRevenueLoading(false)
    }
  }

  return (
    <div className="admin-dashboard-page">
      <AdminNavbar />
      
      <div className="admin-dashboard-container">
        {/* Header */}
        <div className="admin-dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Overview of system activity and statistics</p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Unable to load dashboard. {error}</p>
            <button className="btn-retry" onClick={fetchStats}>
              Try Again
            </button>
          </div>
        ) : stats ? (
          <>
            {/* Stats and Chart Wrapper */}
            <div className="stats-and-chart-wrapper">
              {/* Stats Column */}
              <div className="stats-column">
                {/* Overview Section */}
                <div className="overview-section">
                  <h2 className="section-heading">Overview</h2>
                  
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-label">Total Users</div>
                      <div className="stat-value">{stats.total_users}</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-label">Total Orders</div>
                      <div className="stat-value">{stats.total_orders}</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-label">Paid Orders</div>
                      <div className="stat-value" style={{ color: '#10b981' }}>
                        {stats.paid_orders}
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-label">Failed Payments</div>
                      <div className="stat-value" style={{ color: '#ef4444' }}>
                        {stats.failed_payments}
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-label">Pending Payments</div>
                      <div className="stat-value" style={{ color: '#f59e0b' }}>
                        {stats.pending_payments}
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-label">Total Revenue</div>
                      <div className="stat-value" style={{ color: '#047857' }}>
                        ₹{stats.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Column */}
              <div className="chart-column">
                <div className="revenue-overview-section">
                  <h2 className="section-heading">Revenue Overview</h2>
                  <p className="revenue-subtitle">Last 7 Days</p>
                  <RevenueChart 
                    data={revenueData}
                    isLoading={isRevenueLoading}
                    error={revenueError}
                  />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity-section">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {stats.recent_activity && stats.recent_activity.length > 0 ? (
                  stats.recent_activity.map((activity, idx) => (
                    <div key={idx} className="activity-item">
                      <div className="activity-action">{activity.action}</div>
                      <div className="activity-description">{activity.description}</div>
                      <div className="activity-time">
                        {new Date(activity.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-activity">No recent activity</p>
                )}
              </div>
              
              <div className="view-all-link">
                <a href="/admin/audit-logs">View all activity →</a>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
