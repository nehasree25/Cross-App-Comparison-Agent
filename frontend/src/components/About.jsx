export function About() {
  return (
    <section className="about" id="about">
      <div className="container">
        <h2 className="about-heading">Why CrossApp Agent?</h2>

        <div className="about-content">
          <div className="about-card">
            <div className="about-card-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <h3 className="about-card-title">Compare</h3>
            <p className="about-card-description">
              Compare products across connected apps.
            </p>
          </div>

          <div className="about-card">
            <div className="about-card-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="about-card-title">Decide</h3>
            <p className="about-card-description">
              AI finds the best match for your requirements.
            </p>
          </div>

          <div className="about-card">
            <div className="about-card-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h3 className="about-card-title">Order</h3>
            <p className="about-card-description">
              Create your order directly on the platform.
            </p>
          </div>

          <div className="about-card">
            <div className="about-card-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <h3 className="about-card-title">Pay</h3>
            <p className="about-card-description">
              Complete payment through Razorpay.
            </p>
          </div>

          <div className="about-card">
            <div className="about-card-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="about-card-title">Track</h3>
            <p className="about-card-description">
              Track order and payment status.
            </p>
          </div>

          <div className="about-card">
            <div className="about-card-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="2" x2="12" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="about-card-title">Analyze</h3>
            <p className="about-card-description">
              View spending and order insights on your dashboard.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
