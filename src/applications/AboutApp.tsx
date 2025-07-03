import React from 'react'
import type { WindowState } from '../types/window'
import { Github, Twitch } from 'lucide-react'
import ProfilePic from '../assets/profilepic.png'

interface AboutAppProps {
  window: WindowState
}

export const AboutApp: React.FC<AboutAppProps> = () => {
  return (
    <div className="h-full p-6 overflow-y-auto overflow-x-hidden">
      <div className="max-w-2xl mx-auto min-h-full">
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
            <img 
              src={ProfilePic} 
              alt="Jessica's profile picture" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Jessica</h1>
          <p className="text-gray-600">Welcome to my desktop!</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">About Me</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Hi! I'm Jessica, a web developer with over 15 years of experience creating digital experiences. 
            I'm passionate about building creative and functional web applications using modern technologies 
            like React, TypeScript, and Tailwind CSS, as well as working with PHP and other backend technologies.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            When I'm not coding, you can find me streaming on Twitch! I love playing a big variety of games, 
            especially those with unique mechanics and compelling stories. There's nothing quite like discovering 
            a game that does something completely different or tells an amazing story.
          </p>
          <p className="text-gray-700 leading-relaxed">
            This desktop-style website showcases some of my work and interests. Feel free to explore by 
            double-clicking on the desktop icons to open different applications!
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Connect</h2>
          <div className="grid grid-cols-2 gap-4">
            <a 
              href="https://github.com/itsjesski" 
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 cursor-pointer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={20} />
              <span>GitHub</span>
            </a>
            <a 
              href="https://twitch.tv/jesski" 
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 cursor-pointer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitch size={20} />
              <span>Twitch</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
