export function About() {
  return (
    <section className="about" id="about">
      <div className="container">
        <h2 className="about-heading">Built for smarter cross-app commerce</h2>

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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="about-card-title">For Buyers</h3>
            <p className="about-card-subtitle">
              Describe what you need
            </p>
            <p className="about-card-description">
              Let the agent compare relevant options across connected apps.
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
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h3 className="about-card-title">For Merchants</h3>
            <p className="about-card-subtitle">
              Make products AI-discoverable
            </p>
            <p className="about-card-description">
              Connect your catalog so AI buyers can discover and compare your products.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
