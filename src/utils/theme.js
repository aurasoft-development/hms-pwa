/**
 * Centralized Theme Configuration
 * Update colors here to change the entire application theme
 */

export const theme = {
  colors: {
    // Primary Colors
    primary: {
      main: '#1A1A40',      // Deep Navy Blue
      dark: '#0F0F28',      // Darker Navy
      light: '#2A2A5A',     // Lighter Navy
    },

    // Accent Colors
    accent: {
      main: '#00A8E8',      // Sky Blue
      light: '#33B9EB',     // Light Sky Blue
      dark: '#0087B8',      // Dark Sky Blue
    },

    // Background Colors
    background: {
      primary: '#FFFFFF',   // White
      secondary: '#F8F9FA', // Light Gray
      tertiary: '#F0F9FF',  // Very Light Blue
    },

    // Text Colors
    text: {
      primary: '#2D2D2D',   // Charcoal
      secondary: '#6B7280',  // Muted Gray
      light: '#9CA3AF',     // Light Gray
      white: '#FFFFFF',      // White
    },

    // Status Colors
    status: {
      success: '#10B981',   // Green
      error: '#EF4444',      // Red
      warning: '#F59E0B',    // Orange
      info: '#00A8E8',       // Sky Blue
    },

    // Border Colors
    border: {
      light: '#E5E7EB',     // Light Gray
      medium: '#D1D5DB',     // Medium Gray
      dark: '#9CA3AF',       // Dark Gray
    },

    // Gradient Presets
    gradients: {
      primary: 'linear-gradient(180deg, #1A1A40 0%, #0F0F28 100%)',
      primaryHorizontal: 'linear-gradient(90deg, #1A1A40 0%, #0F0F28 100%)',
      accent: 'linear-gradient(135deg, #039E2F 0%, #027a24 100%)',
      card: 'linear-gradient(135deg, rgba(26,26,64,0.05) 0%, rgba(3,158,47,0.05) 100%)',
    },

    // Shadow Presets
    shadows: {
      sm: '0 1px 2px 0 rgba(26, 26, 64, 0.05)',
      md: '0 4px 6px -1px rgba(26, 26, 64, 0.1)',
      lg: '0 10px 15px -3px rgba(26, 26, 64, 0.1)',
      xl: '0 20px 25px -5px rgba(26, 26, 64, 0.1)',
    },
  },

  // Spacing (if needed)
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  // Border Radius
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
};

// Helper function to get theme color
export const getThemeColor = (path) => {
  const keys = path.split('.');
  let value = theme;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return null;
  }
  return value;
};

// Export default theme
export default theme;

