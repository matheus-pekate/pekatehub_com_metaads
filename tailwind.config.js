/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          950: '#0a1f1f',
          900: '#0d2626',
          800: '#112e2e',
          700: '#163838',
          600: '#1c4545',
          500: '#225252',
        },
        brand: {
          orange: '#F26522',
          'orange-light': '#FF8C4B',
          'orange-dark': '#C94F10',
          teal: '#0d2626',
          'teal-mid': '#163838',
          'teal-light': '#225252',
        },
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        display: ['Barlow Condensed', 'sans-serif'],
      },
      backgroundImage: {
        'teal-gradient': 'linear-gradient(135deg, #0a1f1f 0%, #112e2e 50%, #0d2626 100%)',
      },
    },
  },
  plugins: [],
}
