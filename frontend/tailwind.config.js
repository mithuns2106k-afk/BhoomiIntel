/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0a2540',
          blue: '#1e3a8a',
          accent: '#2563eb',
          gold: '#d97706',
          green: '#065f46',
          emerald: '#059669',
          surface: '#f8fafc',
          border: '#e2e8f0',
          dark: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
