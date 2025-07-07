/**
 * Sound Manager for desktop sound effects
 */

import { secureStorage } from '../utils/secureStorage';

interface SoundPreferences {
  volume: number;
  muted: boolean;
}

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private volume: number = 0.5;
  private muted: boolean = false;
  private audioUnlocked: boolean = false;
  private preferencesKey = 'jesski-desktop-sound-prefs';

  constructor() {
    this.loadPreferences();
    this.setupAudioUnlock();
  }

  /**
   * Setup audio unlock on first user interaction
   */
  private setupAudioUnlock() {
    const unlockAudio = () => {
      if (!this.audioUnlocked) {
        this.audioUnlocked = true;
        this.preloadSounds();
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
      }
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
  }

  /**
   * Preload all sound files
   */
  private async preloadSounds() {
    const soundList = [
      'ui/click',
      'ui/error', 
      'ui/pop'
    ];

    for (const soundPath of soundList) {
      try {
        const audio = new Audio(`/sounds/${soundPath}.mp3`);
        audio.volume = this.muted ? 0 : this.volume;
        audio.preload = 'auto';
        
        const soundName = soundPath.split('/').pop() || soundPath;
        this.sounds.set(soundName, audio);
      } catch (error) {
        console.warn(`Failed to preload sound: ${soundPath}`, error);
      }
    }
  }

  /**
   * Play a sound by name
   */
  play(soundName: string) {
    if (this.muted) return;

    try {
      // If audio not unlocked yet, preload and try to play
      if (!this.audioUnlocked) {
        this.preloadSounds();
        this.audioUnlocked = true;
      }

      const sound = this.sounds.get(soundName);
      if (sound) {
        sound.currentTime = 0; // Reset to start
        sound.volume = this.volume;
        sound.play().catch(err => {
          console.warn(`Failed to play sound: ${soundName}`, err);
        });
      }
    } catch (error) {
      // Fail silently to avoid breaking UI
      console.warn(`Failed to play sound: ${soundName}`, error);
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = this.muted ? 0 : this.volume;
    });
    this.savePreferences();
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.muted = !this.muted;
    this.sounds.forEach(sound => {
      sound.volume = this.muted ? 0 : this.volume;
    });
    this.savePreferences();
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Get mute state
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences() {
    try {
      const saved = secureStorage.getItem(this.preferencesKey);
      if (saved) {
        const prefs: SoundPreferences = JSON.parse(saved);
        this.volume = prefs.volume ?? 0.5;
        this.muted = prefs.muted ?? false;
      }
    } catch (error) {
      console.warn('Failed to load sound preferences', error);
    }
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences() {
    try {
      const prefs: SoundPreferences = {
        volume: this.volume,
        muted: this.muted
      };
      secureStorage.setItem(this.preferencesKey, JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save sound preferences', error);
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
