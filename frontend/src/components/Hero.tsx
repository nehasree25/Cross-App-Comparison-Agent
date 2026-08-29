import React from 'react';
import './Hero.css';

const Hero: React.FC = () => {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Compare Across Apps.
            <br />
            Choose the <span className="hero-highlight">Best</span>.
          </h1>
          <p className="hero-subtitle">
            Tell us what you're looking for. Our AI compares products across connected apps
            and finds the option that best matches your requirements.
          </p>
          <div className="hero-cta">
            <a href="#compare" className="btn-primary">
              Start Comparing
            </a>
            <a href="#how-it-works" className="btn-secondary">
              How It Works
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="comparison-flow">
            <div className="flow-box query-box">
              <div className="query-icon">🔍</div>
              <div className="query-text">
                "Laptop under ₹50K
                <br />
                rating above 4.5"
              </div>
            </div>

            <div className="flow-arrow down">↓</div>

            <div className="flow-section">
              <div className="section-label">CROSS-APP COMPARISON</div>
              <div className="merchants-row">
                <div className="merchant-box">
                  <div className="merchant-label">Merchant 1</div>
                  <div className="product-dot"></div>
                </div>
                <div className="merchants-divider"></div>
                <div className="merchant-box">
                  <div className="merchant-label">Merchant 2</div>
                  <div className="product-dot"></div>
                </div>
              </div>
            </div>

            <div className="flow-arrow down">↓</div>

            <div className="recommendation-box">
              <div className="recommendation-icon">✦</div>
              <div className="recommendation-text">BEST MATCH</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
