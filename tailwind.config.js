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
        'studio-dark': '#07080c',
        'surface-dark': '#0e1017',
        'surface-elevated': '#161824',
        'cyan-glow': '#00f2fe',
        'purple-glow': '#9d4edd',
        'magenta-glow': '#ff007f',
        'amber-glow': '#ffb703'
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        scaleUp: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        slideUp: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }
    },
  },
  plugins: [],
}
