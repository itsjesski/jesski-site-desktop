import React from 'react'
import type { WindowState } from '../../types/window'
import { 
  TextViewer, 
  WebsiteViewer, 
  AboutApp, 
  TwitchChat,
  GamesLibrary,
  BooksLibrary,
  StreamerSoftware,
  SettingsApp,
  MusicApp
} from '../../applications'

interface ApplicationRegistryProps {
  window: WindowState
}

export const ApplicationRegistry: React.FC<ApplicationRegistryProps> = ({ window }) => {
  switch (window.component) {
    case 'text-viewer':
      return <TextViewer window={window} />
    case 'website-viewer':
      return <WebsiteViewer window={window} />
    case 'about':
      return <AboutApp window={window} />
    case 'twitch-chat':
      return <TwitchChat />
    case 'games-library':
      return <GamesLibrary />
    case 'books-library':
      return <BooksLibrary />
    case 'streamer-software':
      return <StreamerSoftware window={window} />
    case 'settings':
      return <SettingsApp window={window} />
    case 'music-app':
      return <MusicApp />
    default:
      return (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2">Unknown Application</h2>
          <p>Component: {window.component}</p>
          <p>Title: {window.title}</p>
          <p>This application component was not found.</p>
        </div>
      );
  }
};
