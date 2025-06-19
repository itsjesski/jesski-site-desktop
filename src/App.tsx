import { Desktop } from './components'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <Desktop />
    </ErrorBoundary>
  )
}

export default App
