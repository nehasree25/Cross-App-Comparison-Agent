import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function AuthenticatedNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Compare', path: '/compare' },
    { label: 'Orders', path: '/orders' },
    { label: 'Profile', path: '/profile' }
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  return (
    <nav className="navbar navbar-authenticated">
      <div className="container">
        <div className="navbar-content">
          {/* Brand */}
          <Link to="/dashboard" className="navbar-brand">
            <img src="/image.png" alt="CrossApp Agent" className="navbar-logo" />
            <span>CrossApp Agent</span>
          </Link>

          {/* Desktop Menu */}
          <div className="navbar-menu navbar-menu-authenticated">
            <ul className="navbar-links">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`navbar-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile Menu Icon */}
          <button
            className="navbar-mobile-menu"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="navbar-mobile-panel">
            <ul className="mobile-menu-links">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`mobile-menu-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <button className="mobile-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
