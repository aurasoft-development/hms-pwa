/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        // Modern & Professional Blue/Teal Palette
        navy: {
          DEFAULT: '#1A1A40',
          dark: '#0F0F28',
          light: '#2A2A5A',
        },
        sky: {
          DEFAULT: '#00A8E8',
          light: '#33B9EB',
          dark: '#0087B8',
        },
        // Backward compatibility - map old colors to new theme
        burgundy: {
          DEFAULT: '#1A1A40', // Map to navy
          dark: '#0F0F28',
        },
        gold: '#00A8E8', // Map to sky blue
        beige: '#FFFFFF', // White background
        charcoal: '#2D2D2D',
        muted: '#6B7280',
        // Primary color system - maps to new theme
        primary: {
          DEFAULT: '#1A1A40',
          50: '#FFFFFF',
          100: '#F0F9FF',
          200: '#E0F2FE',
          300: '#BAE6FD',
          400: '#00A8E8',
          500: '#1A1A40',
          600: '#0F0F28',
          700: '#0A0A1F',
          800: '#0F0F28',
          900: '#0A0A1F',
        },
      },
    },
  },
  plugins: [],
}

