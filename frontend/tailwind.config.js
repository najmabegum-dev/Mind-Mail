/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkred: {
          50: '#fdf2f2',
          100: '#fde8e8',
          200: '#fbd5d5',
          300: '#f8b4b4',
          400: '#f05252',
          500: '#e02424',
          600: '#C5221F', // User's Dark Red
          700: '#a81b18',
          800: '#8a1513',
          900: '#5c0d0c',
          DEFAULT: '#C5221F',
        },
        citrus: {
          100: '#fff3e0',
          200: '#ffe0b2',
          300: '#ffcc80',
          400: '#ffb54d',
          500: '#FFA62B', // Citrus Zest
          600: '#e68c14',
          DEFAULT: '#FFA62B',
        },
        seabreeze: {
          100: '#eaf4ff',
          200: '#d0e7ff',
          300: '#a3d3ff',
          400: '#86C5FF', // Sea Breeze
          500: '#5eaeff',
          DEFAULT: '#86C5FF',
        },
        amalfitile: {
          100: '#e6effa',
          200: '#bfd7f3',
          300: '#8eb8eb',
          400: '#5a93df',
          500: '#3571cd',
          600: '#2E5AA7', // Amalfi Tile
          700: '#234685',
          800: '#193263',
          DEFAULT: '#2E5AA7',
        },
        cream: {
          50: '#fffdf5',
          100: '#fdf7e3',
          200: '#F8E6A0', // Cream Gelato
          300: '#f3d978',
          DEFAULT: '#F8E6A0',
        },
        brand: {
          500: '#C5221F',
          600: '#a81b18',
          700: '#8a1513',
        }
      },
      boxShadow: {
        'glow-red': '0 0 25px -5px rgba(197, 34, 31, 0.4)',
        'glow-blue': '0 0 25px -5px rgba(46, 90, 167, 0.4)',
        'glow-citrus': '0 0 25px -5px rgba(255, 166, 43, 0.4)',
      }
    },
  },
  plugins: [],
}
