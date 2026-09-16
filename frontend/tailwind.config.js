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
        sans: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '2px',
        lg: '2px',
        none: '0px',
      },
      colors: {
        tactical: {
          base: '#070B0F',        // Workspace background
          navy: '#0B1117',        // Navigation & header background
          panel: '#101820',       // Panels & cards
          hover: '#151F28',       // Panel hover states
          border: '#26333D',      // Muted steel borders
          text: '#E7EDF2',        // Off-white primary text
          muted: '#8D9AA5',       // Steel grey secondary text
          dim: '#596771',         // Muted text
          amber: '#F5A623',       // Incident / oil / attention / selected candidate
          cyan: '#25C7D9',        // Modeled intelligence / drift vectors / forecast
          red: '#E05252',         // Critical anomaly / dark radar contact
          green: '#46C77A',       // Verified / active / online
          slate: '#71808C',       // Spatial reference / geodesic line
        },
        // Backward compatibility mappings
        'safety-orange': {
          DEFAULT: '#F5A623',
          hover: '#e6951b',
          muted: 'rgba(245, 166, 35, 0.12)',
          border: 'rgba(245, 166, 35, 0.40)',
        },
        concrete: {
          950: '#070B0F',
          900: '#0B1117',
          850: '#101820',
          800: '#151F28',
          750: '#1e2933',
          700: '#26333D',
          600: '#3a4954',
          500: '#596771',
          400: '#8D9AA5',
          300: '#b0bcc7',
          200: '#d5dde4',
          100: '#E7EDF2',
        }
      }
    },
  },
  plugins: [],
}
