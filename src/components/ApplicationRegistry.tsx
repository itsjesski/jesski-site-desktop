import React from 'react'
import type { WindowState } from '../store/desktopStore'

interface ApplicationRegistryProps {
  window: WindowState
}

export const ApplicationRegistry: React.FC<ApplicationRegistryProps> = ({ window }) => {
  // Temporary simple content to test if window rendering works
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Test Window</h2>
      <p>Component: {window.component}</p>
      <p>Title: {window.title}</p>
      <p>This is a test to see if windows render properly.</p>
    </div>
  )
}
