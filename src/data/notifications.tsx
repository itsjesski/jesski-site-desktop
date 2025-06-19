import React from 'react'
import { Heart, Coffee, Star, Sparkles } from 'lucide-react'

export interface NotificationMessage {
  title: string
  message: string
  icon: React.ReactNode
}

export const NOTIFICATION_MESSAGES: NotificationMessage[] = [
  {
    title: "Fresh Air Break!",
    message: "Time to step outside! Even dogs know the importance of fresh air and sunlight! 🌞",
    icon: <Heart size={16} />
  },
  {
    title: "Hydration Reminder",
    message: "Don't forget to drink water! Stay hydrated like a happy golden retriever on a sunny day! 💧",
    icon: <Coffee size={16} />
  },
  {
    title: "Snack Time!",
    message: "Grab a healthy snack! Fuel your body with something nutritious and delicious! 🥕",
    icon: <Star size={16} />
  },
  {
    title: "Stretch & Move",
    message: "Stand up and stretch! Movement is medicine - dogs stretch naturally all the time! 🧘‍♀️",
    icon: <Sparkles size={16} />
  },
  {
    title: "Gratitude Moment",
    message: "Take a moment to appreciate something good in your life! Gratitude brings joy! 🌟",
    icon: <Heart size={16} />
  },
  {
    title: "Deep Breathing",
    message: "Take three deep breaths. Sometimes the simplest things bring the most peace! 🌸",
    icon: <Star size={16} />
  },
  {
    title: "Social Connection",
    message: "Reach out to someone you care about! Dogs know the value of companionship! 🤝",
    icon: <Sparkles size={16} />
  },
  {
    title: "Posture Check",
    message: "Check your posture! Sit up straight and tall - your spine will thank you! 🦴",
    icon: <Coffee size={16} />
  },
  {
    title: "Mindful Moment",
    message: "Be present in this moment. Notice something beautiful around you! ✨",
    icon: <Star size={16} />
  },
  {
    title: "Self-Compassion",
    message: "Be kind to yourself today! You deserve the same love you'd give a loyal friend! �",
    icon: <Heart size={16} />
  },
  {
    title: "Rest Reminder",
    message: "Rest is productive too! Even energetic labs need their nap time! 😴",
    icon: <Coffee size={16} />
  },
  {
    title: "Joy Break",
    message: "Do something that makes you smile! Life's too short not to find joy in small moments! 🎉",
    icon: <Sparkles size={16} />
  },
  {
    title: "Nature Connection",
    message: "Look outside and appreciate nature! Dogs love the outdoors for good reason! 🌿",
    icon: <Heart size={16} />
  },
  {
    title: "Healthy Habit",
    message: "Pick one small healthy habit to focus on today! Small steps lead to big changes! 🌱",
    icon: <Star size={16} />
  },
  {
    title: "Laugh & Play",
    message: "Find something to laugh about! Playfulness keeps the spirit young! 🎪",
    icon: <Sparkles size={16} />
  },
  {
    title: "Technology Break",
    message: "Take a break from screens! Your eyes need rest just like a tired pup needs sleep! 👀",
    icon: <Coffee size={16} />
  }
]

export const getRandomNotification = (): NotificationMessage => {
  const randomIndex = Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)
  return NOTIFICATION_MESSAGES[randomIndex]
}
