import { useNavigate, Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import './AdminNavbar.css'

export function AdminNavbar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      
      if (token) {
        await fetch('http://localhost:8000/api/auth/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(err => {
          console.error('Logout error:', err)
        })
      }
    } finally {
      // Clear admin session
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      navigate('/admin/login')
    }
  }

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-container">
        <div className="admin-navbar-brand">
          <h1>CrossApp Agent Admin</h1>
        </div>

        <div className="admin-navbar-links">
          <Link to="/admin" className="nav-link">
            Dashboard
          </Link>
          <Link to="/admin/audit-logs" className="nav-link">
            Audit Logs
          </Link>
        </div>

        <button className="nav-logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
