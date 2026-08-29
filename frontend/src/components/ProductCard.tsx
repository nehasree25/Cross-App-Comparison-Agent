import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ProductResult } from '../services/api';
import './ProductCard.css';

interface ProductCardProps {
  product: ProductResult;
  isRecommended?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isRecommended = false }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const spotlight = spotlightRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (spotlight) {
        gsap.to(spotlight, {
          left: x,
          top: y,
          duration: 0.1,
          overwrite: 'auto',
        });
      }

      gsap.to(card, {
        rotationX: (y - rect.height / 2) * 0.02,
        rotationY: (x - rect.width / 2) * -0.02,
        duration: 0.3,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.3,
      });

      if (spotlight) {
        gsap.to(spotlight, {
          opacity: 0,
          duration: 0.2,
        });
      }
    };

    const handleMouseEnter = () => {
      if (spotlight) {
        gsap.to(spotlight, {
          opacity: 1,
          duration: 0.2,
        });
      }
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`product-card ${isRecommended ? 'recommended' : ''}`}
      style={{ perspective: '1000px' } as React.CSSProperties}
    >
      <div
        ref={spotlightRef}
        className="card-spotlight"
        style={{ left: 0, top: 0, opacity: 0 } as React.CSSProperties}
      ></div>

      <div className="card-content">
        <div className="card-header">
          <div>
            <h3 className="product-name">{product.product_name}</h3>
            <p className="product-brand">{product.brand}</p>
          </div>
          {isRecommended && <span className="recommended-badge">✦</span>}
        </div>

        <div className="card-merchant">
          <span className="merchant-label">Merchant</span>
          <span className="merchant-name">{product.merchant}</span>
        </div>

        <div className="card-details">
          <div className="detail-row">
            <span className="detail-label">Price</span>
            <span className="detail-value price">₹{product.final_price.toLocaleString('en-IN')}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Rating</span>
            <span className="detail-value">
              ★ {product.rating.toFixed(1)} ({product.review_count})
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Delivery</span>
            <span className="detail-value">{product.delivery_time_days} days</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Availability</span>
            <span className={`detail-value ${product.in_stock ? 'in-stock' : 'out-of-stock'}`}>
              {product.in_stock ? '✓ In Stock' : '✗ Out of Stock'}
            </span>
          </div>
        </div>

        <button className="btn-view-details">View Product</button>
      </div>
    </div>
  );
};

export default ProductCard;
