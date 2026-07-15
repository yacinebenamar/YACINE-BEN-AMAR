/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fbm: {
          blue: '#060A24',
          'blue-card': '#0B1238',
          'blue-border': '#161F54',
          green: '#8CC63F',
          'green-hover': '#7DB038',
          light: '#F4F6FB',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'soft-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}