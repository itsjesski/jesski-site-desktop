import React from 'react'
import type { WindowState } from '../../types/window'
import { 
  TextViewer, 
  WebsiteViewer, 
  AboutApp, 
  StickerPack,
  TwitchChat,
  GamesLibrary,
  StreamerSoftware,
  SettingsApp,
  MusicApp
} from '../../applications'
import GardenApp from '../garden/GardenApp';
import { GamesHubWindow } from './GamesHubWindow';

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
    case 'sticker-pack':
      return <StickerPack />
    case 'twitch-chat':
      return <TwitchChat />
    case 'games-library':
      return <GamesLibrary />
    case 'streamer-software':
      return <StreamerSoftware window={window} />
    case 'settings':
      return <SettingsApp window={window} />
    case 'music-app':
      return <MusicApp />
    case 'garden-app':
      return <GardenApp />;
    case 'games-hub':
      return <GamesHubWindow />;
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
