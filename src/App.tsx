import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Desktop } from './components/desktop/Desktop'
import { BootLoader } from './components/ui/BootLoader'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { initializeAuthToken } from './services/api/client'
import { soundManager } from './services/soundManager'
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

  // Add global click sound effect
  React.useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // Only play click sound for actual clickable elements or buttons
      const target = event.target as HTMLElement;
      const isClickable = target.tagName === 'BUTTON' || 
                         target.tagName === 'A' || 
                         target.hasAttribute('role') && (
                           target.getAttribute('role') === 'button' ||
                           target.getAttribute('role') === 'tab' ||
                           target.getAttribute('role') === 'menuitem'
                         ) ||
                         target.style.cursor === 'pointer' ||
                         target.classList.contains('cursor-pointer') ||
                         target.closest('button, a, [role="button"], [role="tab"], [role="menuitem"], .cursor-pointer');
      
      if (isClickable) {
        soundManager.play('click');
      }
    };

    // Add listener after boot completes
    if (hasBooted) {
      document.addEventListener('click', handleGlobalClick);
      return () => document.removeEventListener('click', handleGlobalClick);
    }
  }, [hasBooted]);

  const handleBootComplete = () => {
    setIsBooting(false)
    
    // Small delay to show transition
    setTimeout(() => {
      setHasBooted(true)
    }, 300) // Slightly longer delay for smoother transition
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="relative">
          {isBooting && (
            <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${
              isBooting ? 'opacity-100' : 'opacity-0'
            }`}>
              <BootLoader onBootComplete={handleBootComplete} />
            </div>
          )}
          {hasBooted && (
            <div className={`transition-opacity duration-500 ${
              hasBooted && !isBooting ? 'opacity-100' : 'opacity-0'
            }`}>
              <Desktop />
            </div>
          )}
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
