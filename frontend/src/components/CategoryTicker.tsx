import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './CategoryTicker.css';

const categories = [
  'Laptops',
  'Smartphones',
  'Running Shoes',
  'Office Chairs',
  'Headphones',
  'Monitors',
  'Tablets',
  'Accessories',
  'Gaming Keyboards',
  'Webcams',
];

const CategoryTicker: React.FC = () => {
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tickerRef.current) return;

    const ticker = tickerRef.current;
    const items = ticker.querySelectorAll('.category-item');
    const totalWidth = Array.from(items).reduce(
      (sum, item) => sum + (item as HTMLElement).offsetWidth,
      0
    );

    gsap.to('.ticker-content', {
      x: -totalWidth / 2,
      duration: 30,
      ease: 'none',
      repeat: -1,
      onComplete() {
        gsap.set('.ticker-content', { x: 0 });
      },
    });

    // Pause on hover
    ticker.addEventListener('mouseenter', () => {
      gsap.to('.ticker-content', { paused: true });
    });

    ticker.addEventListener('mouseleave', () => {
      gsap.to('.ticker-content', { paused: false });
    });
  }, []);

  return (
    <section className="category-ticker-section">
      <div className="ticker-container" ref={tickerRef}>
        <div className="ticker-content">
          {[...categories, ...categories].map((category, index) => (
            <div key={index} className="category-item">
              <span className="category-icon">◆</span>
              <span className="category-name">{category}</span>
            </div>
          ))}
        </div>
        <div className="ticker-fade-left"></div>
        <div className="ticker-fade-right"></div>
      </div>
    </section>
  );
};

export default CategoryTicker;
