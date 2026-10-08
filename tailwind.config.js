/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#f4f7f4',
        ink: '#122017',
        forest: {
          800: '#1a2c22',
          900: '#142019',
          950: '#0c1410',
        },
        brand: {
          50: '#f3faf5',
          100: '#e3f5e8',
          200: '#c3e8cd',
          600: '#1f7a3a',
          700: '#17632f',
          800: '#124d26',
          900: '#0e3b1d',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'var(--font-bn)', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(18, 32, 23, 0.05), 0 10px 28px rgba(18, 32, 23, 0.06)',
      },
    },
  },
  plugins: [],
};
