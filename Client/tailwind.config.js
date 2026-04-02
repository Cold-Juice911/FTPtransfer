/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        taupe: {
          50: '#fdfcfa',
          100: '#f6f4f0',
          200: '#e9e5de',
          300: '#d5cebe',
          400: '#bbb09b',
          500: '#a2937a',
          600: '#8b7c65',
          700: '#746554',
          800: '#615548',
          900: '#50473e',
          950: '#2a2520',
        },
        primary: {
          DEFAULT: '#8b7c65', // taupe-600
          foreground: '#fdfcfa', // taupe-50
          hover: '#746554', // taupe-700
        },
        background: '#f6f4f0', // taupe-100
        card: '#ffffff',
        text: {
          DEFAULT: '#2a2520', // taupe-950
          muted: '#746554', // taupe-700
        }
      }
    },
  },
  plugins: [],
}
