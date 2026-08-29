import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import CategoryTicker from '../components/CategoryTicker';
import QueryInput from '../components/QueryInput';
import ComparisonResults from '../components/ComparisonResults';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import apiService, { AgentChatResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AgentChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleQuerySubmit = async (searchQuery: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getRecommendations(searchQuery);
      setResults(response);
      setQuery(searchQuery);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <Navbar />
      <Hero />
      <CategoryTicker />
      <QueryInput
        value={query}
        onChange={setQuery}
        onSubmit={handleQuerySubmit}
        loading={loading}
        disabled={!isAuthenticated}
      />

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {results && !loading && (
        <div id="results">
          <ComparisonResults data={results} query={query} />
        </div>
      )}

      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Home;
