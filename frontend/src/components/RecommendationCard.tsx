import React from 'react';
import { RecommendedProduct } from '../services/api';
import './RecommendationCard.css';

interface RecommendationCardProps {
  product: RecommendedProduct;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ product }) => {
  return (
    <div className="recommendation-card">
      <div className="recommendation-header">
        <span className="recommendation-icon">✦</span>
        <span className="recommendation-label">AI RECOMMENDED</span>
      </div>

      <div className="recommendation-body">
        <div className="product-info">
          <h3 className="product-name">{product.product_name}</h3>
          <p className="product-brand">{product.brand}</p>
        </div>

        <div className="product-details">
          <div className="detail">
            <span className="detail-label">Merchant</span>
            <span className="detail-value">{product.merchant}</span>
          </div>

          <div className="detail">
            <span className="detail-label">Price</span>
            <span className="detail-value price">₹{product.final_price.toLocaleString('en-IN')}</span>
          </div>

          <div className="detail">
            <span className="detail-label">Rating</span>
            <span className="detail-value">★ {product.rating.toFixed(1)}</span>
          </div>

          <div className="detail">
            <span className="detail-label">Delivery</span>
            <span className="detail-value">{product.delivery_time_days} days</span>
          </div>
        </div>

        <div className="recommendation-reason">
          <p>{product.reason}</p>
        </div>

        <button className="btn-proceed">Proceed with Selection</button>
      </div>
    </div>
  );
};

export default RecommendationCard;
