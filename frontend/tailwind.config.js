/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          50: '#e6f9ff',
          100: '#b3edff',
          200: '#80e1ff',
          300: '#4dd5ff',
          400: '#1ac9ff',
          500: '#00b8e6',
          600: '#0090b3',
          700: '#006880',
          800: '#00404d',
          900: '#001a1f',
        },
        threat: {
          critical: '#ff1744',
          high: '#ff6d00',
          medium: '#ffc400',
          low: '#00e676',
          info: '#448aff',
        },
        tlp: {
          clear: '#ffffff',
          green: '#00e676',
          amber: '#ffc400',
          'amber-strict': '#ff9100',
          red: '#ff1744',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
