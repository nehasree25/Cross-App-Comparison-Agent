import React from 'react';
import { AgentChatResponse } from '../services/api';
import ProductCard from './ProductCard';
import RecommendationCard from './RecommendationCard';
import './ComparisonResults.css';

interface ComparisonResultsProps {
  data: AgentChatResponse;
  query: string;
}

const ComparisonResults: React.FC<ComparisonResultsProps> = ({ data, query }) => {
  if (!data.products.length) {
    return (
      <section className="comparison-results">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Products Found</h3>
          <p>No products matched your requirements. Please try a different search.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="comparison-results">
      <div className="results-container">
        {/* Query Summary */}
        <div className="query-summary">
          <h2>Comparison Results</h2>
          <div className="query-box">
            <span className="query-label">Your Query:</span>
            <span className="query-text">"{query}"</span>
          </div>
          <div className="results-count">
            Found <strong>{data.products.length}</strong> products across connected merchants
          </div>
        </div>

        {/* AI Recommendation */}
        {data.recommended_product && (
          <RecommendationCard product={data.recommended_product} />
        )}

        {/* All Products */}
        <div className="comparison-section">
          <h3 className="section-title">
            Compare Across Apps ({data.products.length} products)
          </h3>

          <div className="products-grid">
            {data.products.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                isRecommended={
                  data.recommended_product?.product_id === product.product_id
                }
              />
            ))}
          </div>
        </div>

        {/* Agent Message */}
        {data.message && (
          <div className="agent-message">
            <div className="message-icon">✦</div>
            <div className="message-content">
              <h4>Agent Analysis</h4>
              <p>{data.message}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ComparisonResults;
