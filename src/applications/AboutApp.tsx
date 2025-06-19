import React from 'react'
import type { WindowState } from '../store/desktopStore'
import { User, Mail, Github, Linkedin } from 'lucide-react'

interface AboutAppProps {
  window: WindowState
}

export const AboutApp: React.FC<AboutAppProps> = () => {
  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User size={64} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Jess</h1>
          <p className="text-gray-600">Welcome to my desktop!</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">About Me</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            This is my personal desktop-style website. Navigate around by double-clicking
            on the desktop icons to open different applications and explore various content.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Built with React, TypeScript, and Tailwind CSS to recreate the familiar
            Windows desktop experience in the browser.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Connect</h2>
          <div className="grid grid-cols-2 gap-4">
            <a 
              href="mailto:hello@example.com" 
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <Mail size={20} />
              <span>Email</span>
            </a>
            <a 
              href="https://github.com" 
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 cursor-pointer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={20} />
              <span>GitHub</span>
            </a>
            <a 
              href="https://linkedin.com" 
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 cursor-pointer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin size={20} />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
