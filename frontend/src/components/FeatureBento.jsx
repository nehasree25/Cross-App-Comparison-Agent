export function FeatureBento() {
  const features = [
    {
      id: 1,
      title: 'Cross-App Discovery',
      description: 'Search connected apps through a single natural-language request.',
      icon: 'Globe',
    },
    {
      id: 2,
      title: 'Requirement-Aware Comparison',
      description: 'Compare products using the constraints that matter to the buyer.',
      icon: 'BarChart3',
    },
    {
      id: 3,
      title: 'AI Recommendation',
      description: 'Identify the option that best matches the user\'s requirements.',
      icon: 'Sparkles',
    },
    {
      id: 4,
      title: 'Merchant Visibility',
      description: 'Make connected merchant products discoverable to AI buyers.',
      icon: 'Eye',
    },
  ]

  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'Globe':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        )
      case 'BarChart3':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M13 17V9M17 17V5M9 17v-3" />
          </svg>
        )
      case 'Sparkles':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )
      case 'Eye':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <section className="feature-bento">
      <div className="container">
        <div className="bento-grid">
          {features.map((feature) => (
            <div key={feature.id} className="bento-card">
              <div className="bento-icon-wrapper">
                <div className="bento-icon">
                  {renderIcon(feature.icon)}
                </div>
              </div>
              <h3 className="bento-title">{feature.title}</h3>
              <p className="bento-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
