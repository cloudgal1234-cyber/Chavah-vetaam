/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde7ff',
          200: '#c2d4ff',
          300: '#9ab7ff',
          400: '#708eff',
          500: '#4f68ff',
          600: '#3a47f5',
          700: '#2f38d8',
          800: '#2b31ae',
          900: '#282d89',
          950: '#191a52',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
