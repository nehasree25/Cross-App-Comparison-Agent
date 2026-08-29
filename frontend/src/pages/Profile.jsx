import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, User } from 'lucide-react'
import './Profile.css'

export function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <h1>Account Profile</h1>
          <p>Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar">
              <User size={40} />
            </div>
          </div>

          {/* Profile Info */}
          <div className="profile-info">
            <h2>Profile Information</h2>
            
            <div className="info-group">
              <div className="info-item">
                <label className="info-label">Name</label>
                <p className="info-value">{user?.name || 'Not provided'}</p>
              </div>

              <div className="info-item">
                <label className="info-label">Username</label>
                <p className="info-value">{user?.username || 'Not provided'}</p>
              </div>

              <div className="info-item">
                <label className="info-label">Email</label>
                <p className="info-value">{user?.email || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="profile-actions">
            <h2>Account</h2>
            
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="profile-footer">
          <p>Need help? <a href="mailto:support@example.com">Contact support</a></p>
        </div>
      </div>
    </div>
  )
}
