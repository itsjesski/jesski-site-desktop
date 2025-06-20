import React from 'react'
import { Desktop } from './components'
import { BootLoader } from './components/BootLoader'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

function App() {
  const [isBooting, setIsBooting] = React.useState(true)
  const [hasBooted, setHasBooted] = React.useState(false)

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
