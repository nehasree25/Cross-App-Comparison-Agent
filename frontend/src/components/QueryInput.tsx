import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import './QueryInput.css';

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const QueryInput: React.FC<QueryInputProps> = ({
  value,
  onChange,
  onSubmit,
  loading = false,
  disabled = false,
  placeholder = "Find laptops under ₹50,000 with rating above 4.5",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const input = inputRef.current;

    const handleFocus = () => {
      if (!containerRef.current) return;
      gsap.to(containerRef.current, {
        borderColor: '#556B2F',
        boxShadow: '0 0 20px rgba(85, 107, 47, 0.15)',
        duration: 0.3,
      });
    };

    const handleBlur = () => {
      if (!containerRef.current) return;
      gsap.to(containerRef.current, {
        borderColor: '#E5E9E1',
        boxShadow: 'none',
        duration: 0.3,
      });
    };

    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);

    return () => {
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim() && !loading && !disabled) {
      onSubmit(value);
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !loading && !disabled) {
      onSubmit(value);
    }
  };

  return (
    <section className="query-input-section" id="compare">
      <div className="query-input-container">
        <div className="query-label">Tell us what you're looking for</div>

        <div className="query-wrapper">
          <div className="input-container" ref={containerRef}>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={loading || disabled}
              className="query-input"
            />
            <button
              ref={submitBtnRef}
              onClick={handleSubmit}
              disabled={!value.trim() || loading || disabled}
              className={`submit-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Comparing...
                </>
              ) : (
                <>
                  <span className="submit-icon">→</span>
                </>
              )}
            </button>
          </div>

          <div className="input-suggestion">
            <span className="suggestion-icon">✨</span>
            <span>Try: "Compare [product] under ₹[price]" or "[product] with [feature]"</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QueryInput;
