export const apnaResumeTheme = {
  // Primary: Achievement Blue (trust + success)
  primary: {
    50: '#f0f9ff', // Lightest
    100: '#e0f2fe',
    200: '#bae6fd',
    500: '#0ea5e9', // Main blue
    600: '#0284c7',
    700: '#0369a1' // Darkest
  },

  // Secondary: Growth Green (progress + optimization)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e', // Vibrant green
    600: '#16a34a',
    700: '#15803d'
  },

  // Accent: Match Orange (energy + opportunity)
  accent: {
    50: '#fff7ed',
    100: '#fed7aa',
    500: '#fb923c', // Warm orange
    600: '#ea580c',
    700: '#c2410c'
  },

  // Status: Red (missing/gap)
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626'
  },

  // Neutral: Professional Gray
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    500: '#6b7280',
    700: '#374151',
    900: '#111827'
  },

  // Typography
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem' // 36px
    },
    weights: {
      light: 300,
      normal: 400,
      semibold: 600,
      bold: 700,
      extrabold: 800
    }
  },

  // Spacing
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem' // 48px
  },

  // Shadows (for depth)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    glow: '0 0 20px rgba(14, 165, 233, 0.3)' // Glow effect for scores
  },

  // Border radius (modern, smooth)
  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    full: '9999px'
  }
};
