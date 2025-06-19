import React, { useState } from 'react'
import type { WindowState } from '../store/desktopStore'
import { Send, User, Mail, MessageSquare } from 'lucide-react'

interface ContactAppProps {
  window: WindowState
}

export const ContactApp: React.FC<ContactAppProps> = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would normally send the form data to a server
    console.log('Form submitted:', formData)
    setSubmitted(true)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: '', email: '', message: '' })
    }, 3000)
  }

  if (submitted) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Send size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Message Sent!</h2>
          <p className="text-gray-600">Thank you for your message. I'll get back to you soon.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Mail size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Get in Touch</h1>
          <p className="text-gray-600">I'd love to hear from you!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <User size={16} className="mr-2" />
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <Mail size={16} className="mr-2" />
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label htmlFor="message" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <MessageSquare size={16} className="mr-2" />
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your message..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Send size={18} />
            <span>Send Message</span>
          </button>
        </form>
      </div>
    </div>
  )
}
