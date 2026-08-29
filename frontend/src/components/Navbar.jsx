import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Brand */}
          <Link to="/" className="navbar-brand">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
            <span>CrossCompare</span>
          </Link>

          {/* Desktop Menu */}
          <div className="navbar-menu">
            <ul className="navbar-links">
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#how-it-works">How It Works</a>
              </li>
              <li>
                <a href="#categories">Categories</a>
              </li>
            </ul>

            <div className="navbar-auth">
              <Link to="/login" className="btn-login">
                Login
              </Link>
              <Link to="/signup" className="btn-signup">
                Sign Up
              </Link>
            </div>
          </div>

          {/* Mobile Menu Icon */}
          <button className="navbar-mobile-menu" aria-label="Toggle menu">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
