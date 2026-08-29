export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Describe Your Need',
      description:
        'Tell the agent what you are looking for and include the requirements that matter to you, such as price, rating, delivery time, brand or category.',
      icon: 'MessageSquare',
    },
    {
      number: '02',
      title: 'Search & Compare',
      description:
        'The agent searches connected apps, gathers matching products and evaluates them against the requirements in your request.',
      icon: 'Search',
    },
    {
      number: '03',
      title: 'Get the Best Match',
      description:
        'Relevant options are compared and the agent identifies the product that best satisfies your requirements.',
      icon: 'CheckCircle',
    },
  ]

  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'MessageSquare':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )
      case 'Search':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        )
      case 'CheckCircle':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        <h2 className="how-it-works-heading">How It Works</h2>
        <p className="how-it-works-subtitle">
          From your intent to the right choice, in three clear steps.
        </p>

        <div className="how-it-works-grid">
          {steps.map((step) => (
            <div key={step.number} className="how-it-works-card">
              <div className="how-it-works-icon">
                {renderIcon(step.icon)}
              </div>
              <div className="how-it-works-number">{step.number}</div>
              <h3 className="how-it-works-title">{step.title}</h3>
              <p className="how-it-works-description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
