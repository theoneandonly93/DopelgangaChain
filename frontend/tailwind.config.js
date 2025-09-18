module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        banana: {
          yellow: '#FFE135',
          dark: '#0B0B0C',
          accent: '#FFB800',
        },
        dopel: {
          50: '#F9FFE6',
          100: '#EEFFC2',
          200: '#DBFF85',
          300: '#C8FF47',
          400: '#B4FF0A',
          500: '#99E600',
          600: '#78B300',
          700: '#598000',
          800: '#3A4D00',
          900: '#1A1F00'
        }
      },
      fontFamily: {
        banana: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 8px 30px rgba(0,0,0,0.25)'
      },
      borderRadius: {
        xl: '0.9rem'
      }
    }
  },
  plugins: []
}