export function AgentWorkflow() {
  const steps = [
    'User Intent',
    'AI Understands',
    'Cross-App Search',
    'Comparison',
    'Best Option',
  ]

  return (
    <section className="agent-workflow">
      <div className="container">
        <h2 className="agent-workflow-heading">From Intent to Action</h2>
        <p className="agent-workflow-subtitle">
          AI commerce begins with understanding what the buyer wants and ends with helping them make a confident choice.
        </p>

        <div className="workflow-container">
          <div className="workflow-steps">
            {steps.map((step, index) => (
              <div key={index} className="workflow-item">
                <div className="workflow-node">{step}</div>
                {index < steps.length - 1 && (
                  <div className="workflow-arrow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
