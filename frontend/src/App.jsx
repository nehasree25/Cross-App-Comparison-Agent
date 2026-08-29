import './App.css'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { HowItWorks } from './components/HowItWorks'
import { AgentWorkflow } from './components/AgentWorkflow'
import { FeatureBento } from './components/FeatureBento'
import { CategoryTicker } from './components/CategoryTicker'

function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <HowItWorks />
      <AgentWorkflow />
      <FeatureBento />
      <CategoryTicker />
    </>
  )
}

export default App
