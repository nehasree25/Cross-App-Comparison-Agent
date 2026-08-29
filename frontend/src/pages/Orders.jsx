import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'
import './Orders.css'

export function Orders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('http://localhost:8000/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(Array.isArray(data) ? data : data.orders || [])
      } else if (response.status === 404) {
        // No orders endpoint yet, show empty state
        setOrders([])
      } else {
        throw new Error('Failed to fetch orders')
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPaymentStatus = (status) => {
    if (!status) return 'Pending'
    
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

  return (
    <div className="orders-page">
      <div className="orders-container">
        {/* Header */}
        <div className="orders-header">
          <h1>Your Orders</h1>
          <p>View your order history and payment status</p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Unable to load orders. Please try again later.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Package size={48} />
            </div>
            <h2>No Orders Yet</h2>
            <p>Start comparing products and place your first order</p>
            <a href="/compare" className="btn-start-comparing">
              Start Comparing
            </a>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.id}</h3>
                    <p className="order-date">
                      {new Date(order.created_at || order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`status-badge ${getStatusClass(order.payment_status)}`}>
                    {formatPaymentStatus(order.payment_status)}
                  </div>
                </div>

                <div className="order-details">
                  {order.product && (
                    <div className="detail-item">
                      <span className="detail-label">Product:</span>
                      <span className="detail-value">{order.product.name || order.product}</span>
                    </div>
                  )}
                  
                  {order.amount && (
                    <div className="detail-item">
                      <span className="detail-label">Amount:</span>
                      <span className="detail-value">₹{order.amount.toFixed(2)}</span>
                    </div>
                  )}

                  {order.order_status && (
                    <div className="detail-item">
                      <span className="detail-label">Order Status:</span>
                      <span className="detail-value">{order.order_status}</span>
                    </div>
                  )}

                  {order.razorpay_payment_id && (
                    <div className="detail-item">
                      <span className="detail-label">Payment ID:</span>
                      <span className="detail-value">{order.razorpay_payment_id}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
