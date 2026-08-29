import React from 'react';
import './HowItWorks.css';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '1',
      title: 'Tell us what you need',
      description: 'Enter your product requirements, price range, and preferences in natural language.',
      icon: '✎',
    },
    {
      number: '2',
      title: 'Compare across apps',
      description: 'Our AI searches products across multiple connected merchants and apps simultaneously.',
      icon: '🔍',
    },
    {
      number: '3',
      title: 'Get the best match',
      description: 'AI analyzes results and recommends the product that best fits your requirements.',
      icon: '✦',
    },
  ];

  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-it-works-container">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Three simple steps to find the perfect product</p>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.number}</div>
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index < steps.length - 1 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>

        <div className="benefits-section">
          <h3>Why Choose CrossCompare?</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <span className="benefit-icon">⚡</span>
              <h4>Fast & Easy</h4>
              <p>Get recommendations in seconds, not hours</p>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🎯</span>
              <h4>AI-Powered</h4>
              <p>Intelligent comparison across multiple sources</p>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🏪</span>
              <h4>Multi-Merchant</h4>
              <p>Compare products from all connected apps</p>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <h4>Best Value</h4>
              <p>Always find the best option for your budget</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
