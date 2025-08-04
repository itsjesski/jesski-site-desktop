import React from 'react'
import type { WindowState } from '../types/window'
import { Github, Twitch, Mail, Youtube, MessageCircle } from 'lucide-react'
import ProfilePic from '../assets/profilepic.png'

interface AboutAppProps {
  window: WindowState
}

export const AboutApp: React.FC<AboutAppProps> = () => {
  return (
    <div className="h-full p-6 overflow-y-auto overflow-x-hidden">
      <div className="max-w-2xl mx-auto min-h-full">
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden border-4 border-purple-200">
            <img 
              src={ProfilePic} 
              alt="Jesski's VTuber avatar - a cozy puppy girl" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Jesski</h1>
          <p className="text-purple-600 font-medium mb-1">Dog Girl VTuber</p>
          <p className="text-gray-600">Welcome to my cozy corner of the internet! 🐶✨</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">About Me</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            I'm Jesski, your friendly neighborhood dog girl VTuber! 🐕 I create a cozy yet slightly chaotic
            streaming experience where we explore amazing games together. My streams are all
            about discovering unique mechanics, compelling stories, and having wholesome fun with our community.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            When I'm not streaming, I'm a web developer with years of experience. 
            I love building creative projects like this desktop-style website and i hope you enjoy exploring it!
          </p>
          <p className="text-gray-700 leading-relaxed">
            Whether you're here for the cozy vibes, chaotic gameplay, or just want to see what this 
            puppy is up to, you're always welcome in our pack! Feel free to explore the desktop and 
            discover all the fun applications I've built. 🎮✨
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Connect & Follow</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a 
              href="https://twitch.tv/jesski" 
              className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Twitch size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-800">Twitch</div>
                <div className="text-sm text-gray-600">Live streams & cozy vibes</div>
              </div>
            </a>
            
            <a 
              href="https://www.youtube.com/@JesskiStreams" 
              className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Youtube size={20} className="text-red-600" />
              </div>
              <div>
                <div className="font-medium text-gray-800">YouTube</div>
                <div className="text-sm text-gray-600">Stream highlights & videos</div>
              </div>
            </a>
            
            <a 
              href="https://bsky.app/profile/jesski.com" 
              className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                <MessageCircle size={20} className="text-sky-600" />
              </div>
              <div>
                <div className="font-medium text-gray-800">Bluesky</div>
                <div className="text-sm text-gray-600">Updates & puppy thoughts</div>
              </div>
            </a>
            
            <a 
              href="https://github.com/itsjesski" 
              className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Github size={20} className="text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-800">GitHub</div>
                <div className="text-sm text-gray-600">Code & development projects</div>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Business Inquiries</h2>
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail size={20} className="text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">Email</div>
              <div className="text-sm text-gray-600 font-mono">
                business [at] jesski [dot] com
              </div>
              <div className="text-xs text-gray-500 mt-1">
                For collaborations, sponsorships, and business opportunities
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
