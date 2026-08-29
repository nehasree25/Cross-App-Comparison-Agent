import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { HowItWorks } from './components/HowItWorks'
import { AgentWorkflow } from './components/AgentWorkflow'
import { FeatureBento } from './components/FeatureBento'
import { CategoryTicker } from './components/CategoryTicker'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'

function LandingPage() {
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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
