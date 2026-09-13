/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
        sans: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        orange: {
          500: '#ff5500',
          600: '#e64d00',
          700: '#cc4400',
        },
        'safety-orange': {
          DEFAULT: '#ff5500',
          hover: '#e64d00',
          muted: 'rgba(255, 85, 0, 0.12)',
          border: 'rgba(255, 85, 0, 0.40)',
        },
        concrete: {
          950: '#08090c',
          900: '#0e1117',
          850: '#141820',
          800: '#1c222e',
          750: '#252d3d',
          700: '#2e374a',
          600: '#3e475c',
          500: '#5a667d',
          400: '#8b95a5',
          300: '#c2c8d2',
          200: '#e1e5eb',
          100: '#f0f2f5',
        },
        slate: {
          950: '#08090c',
          900: '#0e1117',
          850: '#141820',
          800: '#1c222e',
          750: '#252d3d',
          700: '#2e374a',
          600: '#3e475c',
          500: '#5a667d',
        }
      }
    },
  },
  plugins: [],
}
