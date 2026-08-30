import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { initApiClient } from './utils/apiClient'
import { Navbar } from './components/Navbar'
import { AuthenticatedNavbar } from './components/AuthenticatedNavbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { HowItWorks } from './components/HowItWorks'
import { AgentWorkflow } from './components/AgentWorkflow'
import { FeatureBento } from './components/FeatureBento'
import { CategoryTicker } from './components/CategoryTicker'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { Compare } from './pages/Compare'

import { Orders } from './pages/Orders'
import { Profile } from './pages/Profile'

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

// Conditional navbar component that shows authenticated navbar for protected routes
function AppContent() {
  const { token, loading, handleTokenInvalid } = useAuth()

  // Initialize API client with auth context
  initApiClient({ handleTokenInvalid })

  // Show nothing while auth is loading
  if (loading) {
    return null
  }

  return (
    <>
      {token && <AuthenticatedNavbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compare"
          element={
            <ProtectedRoute>
              <Compare />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
