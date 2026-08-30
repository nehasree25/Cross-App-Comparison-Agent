import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, AlertCircle } from 'lucide-react'
import './Orders.css'

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || ''

// Load Razorpay script
let razorpayScriptLoaded = false
let razorpayScriptPromise = null

const loadRazorpayScript = () => {
  if (razorpayScriptLoaded) {
    return Promise.resolve()
  }
  
  if (razorpayScriptPromise) {
    return razorpayScriptPromise
  }

  razorpayScriptPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) {
      razorpayScriptLoaded = true
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    
    script.onload = () => {
      razorpayScriptLoaded = true
      resolve()
    }
    
    script.onerror = () => {
      razorpayScriptPromise = null
      reject(new Error('Failed to load Razorpay script'))
    }
    
    document.body.appendChild(script)
  })

  return razorpayScriptPromise
}

export function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checkoutingOrderId, setCheckoutingOrderId] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)
  const [ordersPage, setOrdersPage] = useState(1)
  const [paymentFailedOrderId, setPaymentFailedOrderId] = useState(null)
  
  const ORDERS_PER_PAGE = 3

  useEffect(() => {
    fetchOrders()
    // Pre-load Razorpay script on component mount
    loadRazorpayScript().catch(err => {
      console.warn('Razorpay script preload failed:', err)
    })
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
        // Reset pagination when orders are refreshed
        setOrdersPage(1)
      } else if (response.status === 404) {
        setOrders([])
        setOrdersPage(1)
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

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return '—'
    }
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

  const handleCheckout = async (order) => {
    // Validate required data
    if (!order.razorpay_order_id) {
      console.error('Missing razorpay_order_id')
      setPaymentResult({
        type: 'failure',
        message: 'Order information incomplete. Please try again.'
      })
      return
    }

    if (!RAZORPAY_KEY_ID) {
      console.error('Missing RAZORPAY_KEY_ID from environment')
      setPaymentResult({
        type: 'failure',
        message: 'Payment configuration error. Please contact support.'
      })
      return
    }

    setCheckoutingOrderId(order.id)
    
    try {
      // Record checkout start
      const token = localStorage.getItem('token')
      const checkoutResponse = await fetch(`http://localhost:8000/api/orders/${order.id}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!checkoutResponse.ok) {
        throw new Error('Failed to record checkout')
      }

      // Load Razorpay script
      try {
        await loadRazorpayScript()
      } catch (scriptErr) {
        console.error('Razorpay script load error:', scriptErr)
        setCheckoutingOrderId(null)
        setPaymentResult({
          type: 'failure',
          message: 'Unable to load payment checkout. Please try again.'
        })
        return
      }

      // Verify Razorpay is available
      if (!window.Razorpay) {
        console.error('Razorpay not available after script load')
        setCheckoutingOrderId(null)
        setPaymentResult({
          type: 'failure',
          message: 'Payment system unavailable. Please try again.'
        })
        return
      }

      // Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        order_id: order.razorpay_order_id,
        amount: order.amount_paise,
        currency: order.currency || 'INR',
        name: 'Cross-App Comparison Agent',
        description: `Order for Product ID: ${order.product_id}`,
        handler: async (response) => {
          // Clear the failure flag on successful payment
          setPaymentFailedOrderId(null)
          await verifyPayment(order, response)
        },
        "prefill": {
          "contact": "",
          "email": ""
        },
        modal: {
          ondismiss: () => {
            setCheckoutingOrderId(null)
            
            // If payment had already failed, do NOT reset to cancelled/pending
            if (paymentFailedOrderId === order.id) {
              console.log('Checkout dismissed after payment failure, keeping PAYMENT_FAILED status')
              // Do not show payment result - order already marked as failed
              // User can view orders to see the PAYMENT_FAILED status
            } else {
              // No payment failure occurred, just a normal close
              setPaymentResult({
                type: 'cancelled',
                message: 'Payment cancelled'
              })
            }
          }
        },
        "error": async (error) => {
          console.error('Razorpay error:', error)
          await handlePaymentFailure(error, order)
        },
        theme: {
          color: '#047857'
        }
      }

      try {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } catch (err) {
        console.error('Razorpay initialization error:', err)
        setCheckoutingOrderId(null)
        setPaymentResult({
          type: 'failure',
          message: 'Unable to initialize payment checkout. Please try again.'
        })
      }
    } catch (err) {
      console.error('Error starting checkout:', err)
      setCheckoutingOrderId(null)
      setPaymentResult({
        type: 'failure',
        message: err.message || 'Unable to start checkout. Please try again.'
      })
    }
  }

  const handlePaymentFailure = async (error, order) => {
    console.error('Razorpay payment failed:', error)
    
    // Mark that a payment failure occurred for this order
    setPaymentFailedOrderId(order.id)
    
    try {
      const token = localStorage.getItem('token')
      
      // Call the mark-failed endpoint
      const failResponse = await fetch(
        `http://localhost:8000/api/orders/${order.id}/mark-failed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (failResponse.ok) {
        const failData = await failResponse.json()
        console.log('Payment marked as failed:', failData)
        
        setPaymentResult({
          type: 'failure',
          message: 'Payment failed. Please try again.',
          orderId: order.id
        })
        
        // Refresh orders to show updated status
        await fetchOrders()
      } else {
        console.error('Failed to mark payment as failed')
        setPaymentResult({
          type: 'failure',
          message: 'Payment failed. Please try again.'
        })
      }
    } catch (err) {
      console.error('Error marking payment as failed:', err)
      setPaymentResult({
        type: 'failure',
        message: 'Payment failed. Please try again.'
      })
    } finally {
      setCheckoutingOrderId(null)
    }
  }

  const verifyPayment = async (order, response) => {
    try {
      const token = localStorage.getItem('token')
      
      const verifyResponse = await fetch(
        `http://localhost:8000/api/orders/${order.id}/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
        }
      )

      if (verifyResponse.ok) {
        // Clear the failure flag on successful payment
        setPaymentFailedOrderId(null)
        
        setPaymentResult({
          type: 'success',
          message: 'Payment successful',
          orderId: order.id,
          paymentId: response.razorpay_payment_id,
          amount: (order.amount_paise / 100).toFixed(2)
        })
        // Refresh orders to show updated status
        await fetchOrders()
      } else {
        setPaymentResult({
          type: 'failure',
          message: 'Payment verification failed'
        })
      }
    } catch (err) {
      console.error('Error verifying payment:', err)
      setPaymentResult({
        type: 'failure',
        message: 'Unable to verify payment'
      })
    } finally {
      setCheckoutingOrderId(null)
    }
  }

  const handleTryAgain = () => {
    setPaymentResult(null)
    // Clear the failure flag when user clicks Try Again
    setPaymentFailedOrderId(null)
  }

  // Pagination helpers
  const getPaginatedOrders = () => {
    if (!orders || orders.length === 0) {
      return { orders: [], totalPages: 0, startIndex: 0, endIndex: 0 }
    }
    
    const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE)
    const startIndex = (ordersPage - 1) * ORDERS_PER_PAGE
    const endIndex = startIndex + ORDERS_PER_PAGE
    
    return {
      orders: orders.slice(startIndex, endIndex),
      totalPages,
      startIndex,
      endIndex,
      total: orders.length
    }
  }

  const handlePreviousPage = () => {
    setOrdersPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    const { totalPages } = getPaginatedOrders()
    setOrdersPage(prev => Math.min(totalPages, prev + 1))
  }

  const handlePageClick = (pageNum) => {
    setOrdersPage(pageNum)
  }

  if (paymentResult) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className={`payment-result ${paymentResult.type}`}>
            <div className="result-icon">
              {paymentResult.type === 'success' ? (
                <div className="success-icon">✓</div>
              ) : paymentResult.type === 'cancelled' ? (
                <AlertCircle size={48} />
              ) : (
                <AlertCircle size={48} />
              )}
            </div>

            {paymentResult.type === 'success' ? (
              <>
                <h2>Payment Successful</h2>
                <p className="result-message">Your payment has been verified successfully.</p>
                <div className="payment-details">
                  <div className="detail-row">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">₹{paymentResult.amount}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Payment ID:</span>
                    <span className="detail-value">{paymentResult.paymentId}</span>
                  </div>
                  {paymentResult.paymentDate && (
                    <div className="detail-row">
                      <span className="detail-label">Payment Date:</span>
                      <span className="detail-value">{paymentResult.paymentDate}</span>
                    </div>
                  )}
                </div>
              </>
            ) : paymentResult.type === 'cancelled' ? (
              <>
                <h2>Payment Cancelled</h2>
                <p className="result-message">You closed the payment window before completing the payment.</p>
                <p className="result-submessage">You can try again whenever you're ready.</p>
              </>
            ) : (
              <>
                <h2>Payment Failed</h2>
                <p className="result-message">{paymentResult.message}</p>
                <p className="result-submessage">Please try again or contact support if the issue persists.</p>
              </>
            )}

            <div className="result-actions">
              {paymentResult.type !== 'success' && (
                <button className="btn-try-again" onClick={handleTryAgain}>
                  Try Again
                </button>
              )}
              <button className="btn-view-orders" onClick={() => setPaymentResult(null)}>
                View Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        {/* Header */}
        <div className="orders-header">
          <h1>Your Orders</h1>
          <p>Manage your orders and payment status</p>
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
            {getPaginatedOrders().orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-title">
                    <h3>Order #{order.id}</h3>
                    {order.payment_status === 'PAID' && (
                      <span className="paid-badge">✓ Paid</span>
                    )}
                  </div>
                  <div className={`status-badge ${getStatusClass(order.payment_status)}`}>
                    {formatPaymentStatus(order.payment_status)}
                  </div>
                </div>

                <div className="order-content">
                  <div className="order-product">
                    <h4>Product ID: {order.product_id}</h4>
                    <p className="order-amount">₹{parseFloat(order.amount).toLocaleString()}</p>
                  </div>

                  <div className="order-timeline">
                    <div className="timeline-item">
                      <span className="timeline-label">Order Date</span>
                      <span className="timeline-value">{formatDate(order.created_at)}</span>
                    </div>

                    <div className="timeline-item">
                      <span className="timeline-label">Checkout Date</span>
                      <span className="timeline-value">{formatDate(order.checkout_at)}</span>
                    </div>

                    <div className="timeline-item">
                      <span className="timeline-label">Payment Date</span>
                      <span className="timeline-value">{formatDate(order.payment_at)}</span>
                    </div>
                  </div>

                  {order.razorpay_payment_id && (
                    <div className="order-payment-id">
                      <span className="payment-id-label">Payment ID:</span>
                      <span className="payment-id-value">{order.razorpay_payment_id}</span>
                    </div>
                  )}
                </div>

                {order.payment_status !== 'PAID' && (
                  <div className="order-actions">
                    <button
                      className="btn-checkout"
                      onClick={() => handleCheckout(order)}
                      disabled={checkoutingOrderId === order.id}
                    >
                      {checkoutingOrderId === order.id ? 'Opening Checkout...' : 'Checkout'}
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {/* Pagination Controls */}
            {(() => {
              const { totalPages, total, startIndex, endIndex } = getPaginatedOrders()
              if (totalPages <= 1) return null
              
              const pageNumbers = []
              for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i)
              }
              
              return (
                <div className="pagination-section">
                  <p className="pagination-info">
                    Showing {startIndex + 1}–{Math.min(endIndex, total)} of {total} orders
                  </p>
                  
                  <div className="pagination-controls">
                    <button
                      className="btn-pagination-prev"
                      onClick={handlePreviousPage}
                      disabled={ordersPage === 1}
                    >
                      ← Previous
                    </button>
                    
                    <div className="pagination-pages">
                      {pageNumbers.map(pageNum => (
                        <button
                          key={pageNum}
                          className={`pagination-page ${ordersPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageClick(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      className="btn-pagination-next"
                      onClick={handleNextPage}
                      disabled={ordersPage === totalPages}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

    </div>
  )
}
