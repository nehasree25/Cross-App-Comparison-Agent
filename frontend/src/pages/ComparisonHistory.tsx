import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService, { ComparisonSession } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './ComparisonHistory.css';

const ComparisonHistory: React.FC = () => {
  const [sessions, setSessions] = useState<ComparisonSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        const data = await apiService.getComparisonHistory();
        setSessions(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="history-page">
      <Navbar />
      <div className="history-container">
        <div className="history-header">
          <h1>Comparison History</h1>
          <p>View your past product comparisons</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your history...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Comparisons Yet</h3>
            <p>Start comparing products to build your history.</p>
            <a href="/" className="btn-start">
              Start Comparing
            </a>
          </div>
        ) : (
          <div className="history-grid">
            {sessions.map((session) => (
              <div key={session.id} className="history-card">
                <div className="card-header">
                  <span className="category-badge">{session.category}</span>
                  <span className="date">{formatDate(session.created_at)}</span>
                </div>

                <div className="card-content">
                  <p className="query">"{session.user_query}"</p>
                  <div className="card-footer">
                    <span className="product-count">
                      {session.product_count} product{session.product_count !== 1 ? 's' : ''}
                    </span>
                    <button className="btn-details">View Details →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ComparisonHistory;
