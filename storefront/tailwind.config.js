/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff', 100: '#e0e9ff', 200: '#c1d3fe', 300: '#93b4fd',
          400: '#5e8ffa', 500: '#3b6ef5', 600: '#2250ea', 700: '#1a3dd6',
          800: '#1b34ae', 900: '#1c308a', 950: '#141f55',
        },
        gold: { 400: '#f59e0b', 500: '#d97706', 600: '#b45309' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
