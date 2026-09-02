import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminNavbar } from '../components/AdminNavbar'
import { RevenueChart } from '../components/RevenueChart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer } from 'recharts'
import './AdminDashboard.css'

export function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRevenueLoading, setIsRevenueLoading] = useState(true)
  const [error, setError] = useState(null)
  const [revenueError, setRevenueError] = useState(null)

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

  useEffect(() => {
    const loadDashboard = async () => {
      await Promise.all([fetchStats(), fetchRevenueData()])
    }

    void loadDashboard()
  }, [])

  const formatCurrency = (amount) => {
    const value = Number(amount)
    return `₹${(Number.isFinite(value) ? value : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }

  const formatChartAxis = (amount) => {
    const value = Number(amount)
    if (!Number.isFinite(value) || value === 0) return '₹0'
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
    return `₹${value.toFixed(0)}`
  }

  const merchantPerformance = (stats?.merchant_performance || []).map((item) => ({
    merchant: item.merchant || 'Unknown merchant',
    revenue: Number.isFinite(Number(item.revenue)) ? Number(item.revenue) : 0,
    order_count: Number.isFinite(Number(item.order_count)) ? Number(item.order_count) : 0,
  }))

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
            <div className="analytics-grid">
              <div className="overview-section">
                <h2 className="section-heading">Platform Overview</h2>
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
                        {formatCurrency(stats.total_revenue)}
                      </div>
                    </div>
                </div>
                </div>

              <div className="merchant-performance-section">
                  <h2 className="section-heading">Merchant Performance</h2>
                  {merchantPerformance.length > 0 ? (
                    <div className="merchant-stats-grid">
                      {merchantPerformance.map((merchant) => (
                        <div className="merchant-stat-card" key={merchant.merchant}>
                          <div className="stat-label">{merchant.merchant} Revenue</div>
                          <div className="stat-value">{formatCurrency(merchant.revenue)}</div>
                          <div className="merchant-order-count">{merchant.order_count} Orders</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="merchant-empty">No merchant orders available.</p>
                  )}
              </div>

              <div className="revenue-overview-section">
                <h2 className="section-heading">Revenue Overview</h2>
                <p className="revenue-subtitle">Last 7 Days</p>
                <RevenueChart
                  data={revenueData}
                  isLoading={isRevenueLoading}
                  error={revenueError}
                />
              </div>
              <div className="merchant-chart-container">
                <h2 className="section-heading">Revenue Comparison</h2>
                {merchantPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={merchantPerformance} margin={{ top: 15, right: 20, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="merchant" padding={{ left: 18, right: 8 }} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={formatChartAxis} />
                      <Tooltip
                        labelFormatter={(merchant) => merchant}
                        formatter={(value) => [formatCurrency(value), 'Revenue']}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#047857" strokeWidth={3} dot={{ r: 5, fill: '#047857' }} activeDot={{ r: 7 }}>
                        <LabelList dataKey="revenue" position="top" formatter={formatCurrency} fill="#0f172a" fontSize={12} />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="merchant-empty">No merchant revenue available.</p>
                )}
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
