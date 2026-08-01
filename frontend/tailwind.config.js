/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        emeraldPrimary: {
          DEFAULT: '#10b981',
          hover: '#059669',
          light: '#34d399',
          dark: '#047857',
        },
        navySecondary: {
          DEFAULT: '#0b1329',
          surface: '#111c3a',
          card: '#162447',
          border: '#1f3160',
        },
        cyanAccent: {
          DEFAULT: '#06b6d4',
          glow: '#22d3ee',
          dark: '#0e7490',
        },
        // Legacy compatibility mappings
        bgDark: '#070b19',
        bgLight: '#f8fafc',
        cardDark: '#0f172a',
        cardLight: '#ffffff',
        surfaceDark: '#1e293b',
        surfaceLight: '#f1f5f9',
        borderDark: '#334155',
        borderLight: '#e2e8f0',
        tealAccent: '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        }
      },
    },
  },
  plugins: [],
}

