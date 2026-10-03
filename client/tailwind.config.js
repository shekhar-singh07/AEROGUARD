/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        sidebar: {
          DEFAULT: '#0B1523',
          dark: '#070D16',
          hover: '#132135',
          active: '#102A36',
          border: '#1E293B',
          text: '#94A3B8',
          textActive: '#14B8A6',
        },
        surface: {
          50: '#F1F5F9',
          100: '#FFFFFF',
          200: '#F8FAFC',
          300: '#E2E8F0',
        },
        border: {
          subtle: '#E2E8F0',
          prominent: '#CBD5E1',
        },
        teal: {
          brand: '#00C9A7',
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          900: '#134E4A',
          950: '#042F2E',
        },
        met: {
          normal: '#10B981',
          warning: '#F59E0B',
          critical: '#EF4444',
          info: '#3B82F6',
          weather: '#06B6D4',
          fault: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
