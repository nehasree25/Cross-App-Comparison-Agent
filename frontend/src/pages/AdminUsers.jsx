import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertCircle } from 'lucide-react'
import { AdminNavbar } from '../components/AdminNavbar'
import './AdminUsers.css'

export function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchQuery])

  const fetchUsers = async () => {
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
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(
        `http://localhost:8000/api/admin/users?${params}`,
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
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.items)
      setCurrentPage(data.page)
      setTotalPages(data.total_pages)
      setTotal(data.total)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to page 1 on search
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

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  const handleCloseModal = () => {
    setShowDetailsModal(false)
    setSelectedUser(null)
  }

  const handleStatusChange = (newStatus) => {
    setConfirmAction({
      action: newStatus ? 'enable' : 'disable',
      newStatus: newStatus,
    })
    setShowConfirmDialog(true)
  }

  const handleConfirmStatusChange = async () => {
    if (!confirmAction || !selectedUser) return

    setIsProcessing(true)
    try {
      const token = localStorage.getItem('adminToken')
      
      const response = await fetch(
        `http://localhost:8000/api/admin/users/${selectedUser.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_active: confirmAction.newStatus }),
        }
      )

      if (!response.ok) {
        let errorMessage = 'Failed to update user status'
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Update the selected user in modal
      setSelectedUser(prev => ({
        ...prev,
        is_active: confirmAction.newStatus,
      }))

      // Refresh the users list
      await fetchUsers()

      // Close dialogs
      setShowConfirmDialog(false)
      setConfirmAction(null)
    } catch (err) {
      console.error('Error updating user status:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false)
    setConfirmAction(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="admin-users-page">
      <AdminNavbar />
      
      <div className="admin-users-container">
        {/* Header */}
        <div className="users-header">
          <h1>User Management</h1>
          <p>Manage registered users and account status</p>
        </div>

        {/* Search Bar */}
        <div className="users-search-section">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search username, email or name..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={48} />
            <p>Unable to load users. {error}</p>
            <button className="btn-retry" onClick={fetchUsers}>
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No users found</p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Last Login</th>
                    <th>Status</th>
                    <th>Orders</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-name">
                          <strong>{user.name}</strong>
                          <span className="username">@{user.username}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>{formatDate(user.last_login)}</td>
                      <td>
                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <span className="orders-count">{user.total_orders}</span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn-view"
                            onClick={() => handleViewUser(user)}
                          >
                            View
                          </button>
                        </div>
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
                  {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} users
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

            {/* Always show pagination info */}
            {totalPages <= 1 && (
              <div className="pagination-section">
                <p className="pagination-info">
                  Showing {total} of {total} users
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <div className="modal-body">
              {/* User Information */}
              <div className="details-section">
                <h3>Account Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <p>{selectedUser.name}</p>
                  </div>
                  <div className="detail-item">
                    <label>Username</label>
                    <p>@{selectedUser.username}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <p>
                      <span className={`status-badge ${selectedUser.is_active ? 'active' : 'inactive'}`}>
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div className="detail-item">
                    <label>Joined Date</label>
                    <p>{formatDateTime(selectedUser.created_at)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Last Login</label>
                    <p>{formatDateTime(selectedUser.last_login) || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Order Statistics */}
              <div className="details-section">
                <h3>Order Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Total Orders</span>
                    <span className="stat-value">{selectedUser.total_orders}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Paid Orders</span>
                    <span className="stat-value" style={{ color: '#10b981' }}>
                      {selectedUser.paid_orders}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Pending Orders</span>
                    <span className="stat-value" style={{ color: '#f59e0b' }}>
                      {selectedUser.pending_orders}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Failed Orders</span>
                    <span className="stat-value" style={{ color: '#ef4444' }}>
                      {selectedUser.failed_orders}
                    </span>
                  </div>
                </div>

                <div className="total-spent">
                  <label>Total Spent</label>
                  <p className="amount">₹{selectedUser.total_spent.toLocaleString('en-IN', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {selectedUser.is_active ? (
                <button
                  className="btn-disable"
                  onClick={() => handleStatusChange(false)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Disable User'}
                </button>
              ) : (
                <button
                  className="btn-enable"
                  onClick={() => handleStatusChange(true)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Enable User'}
                </button>
              )}
              <button className="btn-close" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="modal-overlay" onClick={handleCancelConfirm}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-header">
              <h3>Confirm Action</h3>
            </div>
            <div className="confirm-body">
              <p>
                Are you sure you want to{' '}
                <strong>
                  {confirmAction.action === 'disable' ? 'disable' : 'enable'}
                </strong>
                {' '}this user <strong>@{selectedUser.username}</strong>?
              </p>
              {confirmAction.action === 'disable' && (
                <p className="warning-text">
                  This user will not be able to log in or access their account.
                </p>
              )}
              {confirmAction.action === 'enable' && (
                <p className="info-text">
                  This user will be able to log in and access their account.
                </p>
              )}
            </div>
            <div className="confirm-footer">
              <button className="btn-cancel" onClick={handleCancelConfirm}>
                Cancel
              </button>
              <button
                className={`btn-confirm ${confirmAction.action}`}
                onClick={handleConfirmStatusChange}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
