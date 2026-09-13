/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0b0e14',
          900: '#111622',
          850: '#161d2d',
          800: '#1c2438',
          750: '#232d45',
          700: '#2c3754',
          600: '#3d4b6e',
          500: '#64748b',
        }
      }
    },
  },
  plugins: [],
}
