// Theme configuration for easy customization
export interface ThemeConfig {
  // Desktop background
  desktopBackground: {
    type: 'gradient' | 'image' | 'solid';
    value: string; // CSS gradient, image URL, or solid color
    overlay?: string; // Optional overlay for better contrast with background images
  };
  
  // Color palette
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
  };
}

// Default theme configuration
export const defaultTheme: ThemeConfig = {
  desktopBackground: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #fbbf24, #22c55e, #fcd34d)',
  },
  colors: {
    primary: '#8b7355', // Warm brown
    secondary: '#16a34a', // Natural green
    accent: '#f59e0b', // Warm amber
    neutral: '#78716c', // Warm gray
  },
};

// Alternative themes for easy switching
export const themes = {
  naturalWood: {
    desktopBackground: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #fbbf24, #22c55e, #fcd34d)',
    },
    colors: {
      primary: '#8b7355',
      secondary: '#16a34a',
      accent: '#f59e0b',
      neutral: '#78716c',
    },
  },
  forestCabin: {
    desktopBackground: {
      type: 'image',
      value: '/images/forest-cabin-bg.jpg', // You can add your own background image here
      overlay: 'linear-gradient(135deg, rgba(139, 115, 85, 0.4), rgba(22, 163, 74, 0.3))',
    },
    colors: {
      primary: '#5d4a38',
      secondary: '#14532d',
      accent: '#92400e',
      neutral: '#44403c',
    },
  },
  autumn: {
    desktopBackground: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #dc2626, #f59e0b, #eab308)',
    },
    colors: {
      primary: '#92400e',
      secondary: '#166534',
      accent: '#dc2626',
      neutral: '#57534e',
    },
  },
} as const;

// Function to apply theme to CSS custom properties
export const applyTheme = (theme: ThemeConfig) => {
  const root = document.documentElement;
  
  // Apply desktop background
  if (theme.desktopBackground.type === 'image') {
    root.style.setProperty('--desktop-bg-image', `url(${theme.desktopBackground.value})`);
    root.style.setProperty('--desktop-bg', theme.desktopBackground.overlay || 'transparent');
  } else if (theme.desktopBackground.type === 'gradient') {
    root.style.setProperty('--desktop-bg', theme.desktopBackground.value);
    root.style.setProperty('--desktop-bg-image', 'none');
  } else {
    root.style.setProperty('--desktop-bg', theme.desktopBackground.value);
    root.style.setProperty('--desktop-bg-image', 'none');
  }
};

// Hook for using theme in React components
export const useTheme = () => {
  const setTheme = (themeName: keyof typeof themes) => {
    applyTheme(themes[themeName]);
  };

  const setCustomBackground = (imageUrl: string, overlay?: string) => {
    const customTheme: ThemeConfig = {
      ...defaultTheme,
      desktopBackground: {
        type: 'image',
        value: imageUrl,
        overlay,
      },
    };
    applyTheme(customTheme);
  };

  return {
    setTheme,
    setCustomBackground,
    themes: Object.keys(themes) as Array<keyof typeof themes>,
  };
};
