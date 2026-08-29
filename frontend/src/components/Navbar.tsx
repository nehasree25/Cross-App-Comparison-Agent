import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

interface NavItem {
  label: string;
  href: string;
}

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Compare', href: '/#compare' },
    { label: 'History', href: '/history' },
    { label: 'How It Works', href: '/#how-it-works' },
  ];

  useEffect(() => {
    navItemsRef.current.forEach((item, index) => {
      if (!item) return;

      item.addEventListener('mouseenter', () => {
        gsap.to(item, {
          duration: 0.3,
          color: '#FFFFFF',
          backgroundColor: '#556B2F',
          paddingX: 16,
          borderRadius: 20,
        });
      });

      item.addEventListener('mouseleave', () => {
        if (activeIndex !== index) {
          gsap.to(item, {
            duration: 0.3,
            color: '#172018',
            backgroundColor: 'transparent',
            paddingX: 0,
          });
        }
      });
    });
  }, [activeIndex]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <div className="logo-icon">◆</div>
          <span>CrossCompare</span>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-menu">
          {navItems.map((item, index) => (
            <div
              key={index}
              ref={(el) => {
                navItemsRef.current[index] = el;
              }}
              className="nav-item"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <a href={item.href}>{item.label}</a>
            </div>
          ))}
        </div>

        {/* Auth Section */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              <span className="user-greeting">Welcome, {user?.username}</span>
              <button className="btn-logout" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="btn-login">
                Login
              </a>
              <a href="/signup" className="btn-signup">
                Sign Up
              </a>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          {navItems.map((item, index) => (
            <a key={index} href={item.href} className="mobile-nav-item">
              {item.label}
            </a>
          ))}
          {!isAuthenticated && (
            <>
              <a href="/login" className="mobile-nav-item">
                Login
              </a>
              <a href="/signup" className="mobile-nav-item">
                Sign Up
              </a>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
