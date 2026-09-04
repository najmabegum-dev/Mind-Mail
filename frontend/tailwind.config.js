/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clean white background across all pages
        warmwhite: '#FFFFFF',
        creamgelato: {
          DEFAULT: '#F8E6A0',
          tint: 'rgba(248, 230, 160, 0.12)',
          surface: '#FDFBF5',
          subtle: '#FBF6E9',
          border: '#EEDFB8',
        },
        amalfitile: {
          DEFAULT: '#2E5AA7',
          hover: '#234685',
          dark: '#1A3563',
          light: '#4270C0',
          tint: 'rgba(46, 90, 167, 0.08)',
        },
        citrus: {
          DEFAULT: '#FFA62B',
          hover: '#e69019',
          dark: '#c2740a',
          light: '#ffb957',
          tint: 'rgba(255, 166, 43, 0.12)',
        },
        seabreeze: {
          DEFAULT: '#86C5FF',
          dark: '#1E64B8',
          hover: '#68b1f5',
          tint: 'rgba(134, 197, 255, 0.16)',
        },
        coralflame: {
          DEFAULT: '#E8543F',
          hover: '#d03e2a',
          dark: '#b32d1c',
          tint: 'rgba(232, 84, 63, 0.12)',
        },
      },
      boxShadow: {
        'citrus-hero': '0 8px 25px -4px rgba(255, 166, 43, 0.35)',
        'amalfi-struct': '0 8px 25px -4px rgba(46, 90, 167, 0.18)',
        'coral-alert': '0 8px 25px -4px rgba(232, 84, 63, 0.25)',
      }
    },
  },
  plugins: [],
}
