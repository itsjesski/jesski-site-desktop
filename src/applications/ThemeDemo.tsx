import React from 'react'
import { useTheme } from '../theme/themeConfig'

export const ThemeDemo: React.FC = () => {
  const { setTheme, setCustomBackground, themes } = useTheme()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Theme Customization Demo
        </h2>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          This demonstrates how easy it is to change themes and background images using our centralized theme system.
        </p>
      </div>

      {/* Theme Selector */}
      <div>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Quick Theme Selection
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((themeName) => (
            <button
              key={themeName}
              onClick={() => setTheme(themeName)}
              className="px-4 py-3 rounded-lg border transition-all hover:shadow-md"
              style={{
                backgroundColor: 'var(--window-bg)',
                borderColor: 'var(--window-border)',
                color: 'var(--text-primary)'
              }}
            >
              <div className="text-sm font-medium capitalize">
                {themeName.replace(/([A-Z])/g, ' $1')}
              </div>
              <div className="text-xs mt-1 opacity-70">
                {themeName === 'naturalWood' && 'Warm browns & greens'}
                {themeName === 'forestCabin' && 'Deep woods with background'}
                {themeName === 'autumn' && 'Red & gold autumn colors'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Background */}
      <div>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Custom Background Image
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
            className="w-full px-3 py-2 border rounded-lg"
            style={{
              backgroundColor: 'var(--window-bg)',
              borderColor: 'var(--window-border)',
              color: 'var(--text-primary)'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const url = (e.target as HTMLInputElement).value
                if (url) {
                  setCustomBackground(url, 'linear-gradient(135deg, rgba(139, 115, 85, 0.3), rgba(22, 163, 74, 0.2))')
                }
              }
            }}
          />
          <p className="text-xs opacity-70" style={{ color: 'var(--text-secondary)' }}>
            Press Enter to apply. The overlay provides better text contrast.
          </p>
        </div>
      </div>

      {/* Example Presets */}
      <div>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Example Background Images
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setCustomBackground(
              'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200',
              'linear-gradient(135deg, rgba(139, 115, 85, 0.4), rgba(22, 163, 74, 0.3))'
            )}
            className="px-4 py-3 rounded-lg border text-left transition-all hover:shadow-md"
            style={{
              backgroundColor: 'var(--window-bg)',
              borderColor: 'var(--window-border)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="text-sm font-medium">Forest Path</div>
            <div className="text-xs mt-1 opacity-70">Peaceful woodland scene</div>
          </button>
          <button
            onClick={() => setCustomBackground(
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
              'linear-gradient(135deg, rgba(139, 115, 85, 0.4), rgba(22, 163, 74, 0.3))'
            )}
            className="px-4 py-3 rounded-lg border text-left transition-all hover:shadow-md"
            style={{
              backgroundColor: 'var(--window-bg)',
              borderColor: 'var(--window-border)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="text-sm font-medium">Mountain Vista</div>
            <div className="text-xs mt-1 opacity-70">Majestic mountain landscape</div>
          </button>
        </div>
      </div>

      {/* Theme Variables Info */}
      <div>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          How It Works
        </h3>
        <div 
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-neutral-100)',
            borderColor: 'var(--window-border)'
          }}
        >
          <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
            All colors are defined as CSS custom properties in <code>src/theme/theme.css</code>:
          </p>
          <ul className="text-xs space-y-1 ml-4" style={{ color: 'var(--text-secondary)' }}>
            <li>• <code>--desktop-bg</code> - Desktop background</li>
            <li>• <code>--desktop-bg-image</code> - Background image</li>
            <li>• <code>--window-bg</code> - Window backgrounds</li>
            <li>• <code>--taskbar-bg</code> - Taskbar color</li>
            <li>• <code>--icon-bg</code> - Desktop icon backgrounds</li>
            <li>• And many more...</li>
          </ul>
          <p className="text-sm mt-3" style={{ color: 'var(--text-primary)' }}>
            Use <code>src/theme/themeConfig.ts</code> to create and apply new themes programmatically.
          </p>
        </div>
      </div>
    </div>
  )
}
