import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './Dashboard.css'

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      
      const response = await fetch('http://localhost:8000/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load dashboard')
      }

      const data = await response.json()
      setDashboard(data)
    } catch (err) {
      console.error('Error fetching dashboard:', err)
      setError('Unable to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartComparing = () => {
    navigate('/compare')
  }

  const handleCheckout = () => {
    navigate('/orders')
  }

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })
  }

  const formatPaymentStatus = (status) => {
    const statusMap = {
      'PAYMENT_PENDING': 'Payment Pending',
      'PAID': 'Paid',
      'PAYMENT_FAILED': 'Payment Failed'
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status) => {
    if (!status) return 'status-pending'
    
    const statusLower = status.toLowerCase()
    if (statusLower.includes('pending')) return 'status-pending'
    if (statusLower.includes('paid')) return 'status-paid'
    if (statusLower.includes('failed')) return 'status-failed'
    
    return 'status-pending'
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="error-state">
            <AlertCircle size={48} />
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchDashboard}>Try Again</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="dashboard-welcome">
          <div className="welcome-header">
            <h1>Welcome back, {dashboard?.user?.name || 'User'} 👋</h1>
            <p>Compare products across apps and find the best match for your needs.</p>
          </div>
          <button className="btn-start-comparing" onClick={handleStartComparing}>
            Start Comparing
            
          </button>
        </div>

        {/* Analytics Section */}
        <div className="analytics-section">
          <h2>Analytics</h2>
          <div className="analytics-grid">
            {/* Comparisons */}
            <div className="analytics-card">
              <div className="card-label">Comparisons</div>
              <div className="card-value">{dashboard?.stats?.total_comparisons || 0}</div>
            </div>

            {/* Total Orders */}
            <div className="analytics-card">
              <div className="card-label">Total Orders</div>
              <div className="card-value">{dashboard?.stats?.total_orders || 0}</div>
            </div>

            {/* Total Spent */}
            <div className="analytics-card">
              <div className="card-label">Total Spent</div>
              <div className="card-value">{formatCurrency(dashboard?.stats?.total_spent || 0)}</div>
            </div>

            {/* Paid Orders */}
            <div className="analytics-card">
              <div className="card-label">Paid Orders</div>
              <div className="card-value">{dashboard?.stats?.paid_orders || 0}</div>
            </div>

            {/* Pending Orders */}
            <div className="analytics-card">
              <div className="card-label">Pending Orders</div>
              <div className="card-value">{dashboard?.stats?.pending_orders || 0}</div>
            </div>

            {/* Payment Success Rate */}
            <div className="analytics-card">
              <div className="card-label">Payment Success</div>
              <div className="card-value">
                {dashboard?.stats?.payment_success_rate !== null 
                  ? `${dashboard?.stats?.payment_success_rate}%`
                  : '—'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Spending Overview Section */}
        <div className="spending-section">
          <div className="spending-header">
            <h2>Spending Overview · Last 7 Days</h2>
          </div>
          
          {dashboard?.daily_spending && dashboard.daily_spending.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={dashboard.daily_spending}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(date) => {
                      const d = new Date(date)
                      return `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '10px'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Spent']}
                    labelFormatter={(date) => {
                      const d = new Date(date)
                      return d.toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#047857"
                    strokeWidth={2}
                    dot={{ fill: '#047857', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-empty">
              <p>No spending in the last 7 days.</p>
            </div>
          )}
        </div>

        {/* Recent Orders Section */}
        {dashboard?.recent_orders && dashboard.recent_orders.length > 0 && (
          <div className="recent-orders-section">
            <h2>Recent Orders</h2>
            <div className="orders-table">
              <div className="table-header">
                <div className="col-product">Product</div>
                <div className="col-amount">Amount</div>
                <div className="col-status">Status</div>
                <div className="col-action"></div>
              </div>
              
              {dashboard.recent_orders.map((order) => (
                <div key={order.id} className="table-row">
                  <div className="col-product">{order.product_name}</div>
                  <div className="col-amount">{formatCurrency(parseFloat(order.amount))}</div>
                  <div className="col-status">
                    <span className={`status-badge ${getStatusClass(order.payment_status)}`}>
                      {formatPaymentStatus(order.payment_status)}
                    </span>
                  </div>
                  <div className="col-action">
                    {order.payment_status === 'PAYMENT_PENDING' && (
                      <button
                        className="btn-checkout-small"
                        onClick={handleCheckout}
                      >
                        Checkout
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


