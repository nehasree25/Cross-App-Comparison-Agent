import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminNavbar } from '../components/AdminNavbar'
import './AdminAuditLogs.css'

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'USER_LOGIN', label: 'User Login' },
  { value: 'USER_SIGNUP', label: 'User Signup' },
  { value: 'USER_LOGOUT', label: 'User Logout' },
  { value: 'ADMIN_LOGIN', label: 'Admin Login' },
  { value: 'ADMIN_LOGOUT', label: 'Admin Logout' },
  { value: 'ORDER_CREATED', label: 'Order Created' },
  { value: 'CHECKOUT_STARTED', label: 'Checkout Started' },
  { value: 'PAYMENT_SUCCESS', label: 'Payment Success' },
  { value: 'PAYMENT_FAILED', label: 'Payment Failed' },
]

export function AdminAuditLogs() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedAction, setSelectedAction] = useState('all')
  const [total, setTotal] = useState(0)

  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchLogs()
  }, [currentPage, selectedAction])

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('adminToken')
      
      if (!token) {
        navigate('/admin/login')
        return
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        ...(selectedAction !== 'all' && { action: selectedAction }),
      })

      const response = await fetch(
        `http://localhost:8000/api/admin/audit-logs?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        if (response.status === 403) {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
          navigate('/admin/login')
          return
        }
        throw new Error('Failed to fetch audit logs')
      }

      const data = await response.json()
      setLogs(data.items)
      setCurrentPage(data.page)
      setTotalPages(data.total_pages)
      setTotal(data.total)
    } catch (err) {
      console.error('Error fetching logs:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  const handlePageClick = (pageNum) => {
    setCurrentPage(pageNum)
  }

  const handleActionChange = (e) => {
    setSelectedAction(e.target.value)
    setCurrentPage(1)
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="admin-audit-logs-page">
      <AdminNavbar />
      
      <div className="admin-audit-logs-container">
        {/* Header */}
        <div className="audit-logs-header">
          <h1>Audit Logs</h1>
          <p>System activity and event history</p>
        </div>

        {/* Filters */}
        <div className="audit-logs-filters">
          <div className="filter-group">
            <label htmlFor="action-filter">Action:</label>
            <select
              id="action-filter"
              value={selectedAction}
              onChange={handleActionChange}
              className="filter-select"
            >
              {ACTION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Unable to load audit logs. {error}</p>
            <button className="btn-retry" onClick={fetchLogs}>
              Try Again
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>No audit logs found</p>
          </div>
        ) : (
          <>
            {/* Logs Table */}
            <div className="logs-table-wrapper">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>User ID</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Resource</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.created_at)}</td>
                      <td>{log.user_id}</td>
                      <td>
                        <span className={`action-badge action-${log.action.toLowerCase()}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.description}</td>
                      <td>
                        {log.resource_type && log.resource_id
                          ? `${log.resource_type}#${log.resource_id}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-section">
                <p className="pagination-info">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} events
                </p>
                
                <div className="pagination-controls">
                  <button
                    className="btn-pagination-prev"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  
                  <div className="pagination-pages">
                    {(() => {
                      const pages = []
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i)
                      }
                      return pages.map(pageNum => (
                        <button
                          key={pageNum}
                          className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageClick(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ))
                    })()}
                  </div>
                  
                  <button
                    className="btn-pagination-next"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
