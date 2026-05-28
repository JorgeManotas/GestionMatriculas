/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f8fb',
          100: '#e9eef5',
          200: '#d8e0eb',
          500: '#68758a',
          700: '#344054',
          900: '#141c2b'
        },
        brand: {
          50: '#eef9fb',
          100: '#d5f0f5',
          500: '#1d6f8f',
          600: '#185c77',
          700: '#134e65'
        },
        money: {
          50: '#eefaf4',
          500: '#1f8a5b',
          700: '#176b47'
        },
        risk: {
          50: '#fff7ed',
          500: '#c46a14',
          700: '#9a4d07'
        },
        danger: {
          50: '#fff1f2',
          500: '#ba2f3b',
          700: '#962431'
        }
      },
      boxShadow: {
        shell: '0 18px 45px rgba(20, 28, 43, 0.08)'
      }
    }
  },
  plugins: []
};
