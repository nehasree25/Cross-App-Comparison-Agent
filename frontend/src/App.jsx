import './App.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { initApiClient } from './utils/apiClient'
import { Navbar } from './components/Navbar'
import { AuthenticatedNavbar } from './components/AuthenticatedNavbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
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
import { AdminLogin } from './pages/AdminLogin'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminAuditLogs } from './pages/AdminAuditLogs'

function LandingPage() {
  return (
    <>
      <Hero />
      <About />
      <HowItWorks />
      <AgentWorkflow />
      <FeatureBento />
      <CategoryTicker />
    </>
  )
}

// Smart navbar component - decides which navbar to render based on current route
function NavbarRouter() {
  const location = useLocation()
  const { token } = useAuth()
  
  // Admin pages don't show regular navbar
  if (location.pathname.startsWith('/admin')) {
    return null
  }
  
  // Landing page always uses the landing navbar
  if (location.pathname === '/') {
    return <Navbar />
  }
  
  // Application pages only use authenticated navbar
  const appRoutes = ['/dashboard', '/compare', '/orders', '/profile']
  if (appRoutes.includes(location.pathname)) {
    return <AuthenticatedNavbar />
  }
  
  // For login/signup pages, don't render a navbar (or render a minimal one)
  return null
}

// Conditional navbar component that shows authenticated navbar for protected routes
function AppContent() {
  const { loading, handleTokenInvalid } = useAuth()

  // Initialize API client with auth context
  initApiClient({ handleTokenInvalid })

  // Show nothing while auth is loading
  if (loading) {
    return null
  }

  return (
    <>
      <NavbarRouter />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <AdminProtectedRoute>
              <AdminAuditLogs />
            </AdminProtectedRoute>
          }
        />

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
