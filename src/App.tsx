import React from 'react'
import { Desktop } from './components/desktop/Desktop'
import { BootLoader } from './components/ui/BootLoader'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { initializeAuthToken } from './services/api/client'
import './App.css'

function App() {
  const [isBooting, setIsBooting] = React.useState(true)
  const [hasBooted, setHasBooted] = React.useState(false)
  
  // Initialize auth token on app startup
  React.useEffect(() => {
    // Pre-fetch token at app startup
    initializeAuthToken().catch(err => 
      console.error('Failed to initialize auth token:', err)
    );
  }, []);

  const handleBootComplete = () => {
    setIsBooting(false)
    
    // Small delay to show transition
    setTimeout(() => {
      setHasBooted(true)
    }, 200)
  }

  return (
    <ErrorBoundary>
      {isBooting && <BootLoader onBootComplete={handleBootComplete} />}
      {hasBooted && <Desktop />}
    </ErrorBoundary>
  )
}

export default App
