/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#5754FF',
          dark: '#0A0A0B',
          cyan: '#00AEC2',
          orange: '#FF6F22',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Open Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
