/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fade-in 0.3s ease',
        'modal-slide': 'modal-slide 0.3s ease forwards',
      },
      keyframes: {
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'modal-slide': {
          'from': { 
            transform: 'scale(0.9) translateY(20px)',
            opacity: '0'
          },
          'to': { 
            transform: 'scale(1) translateY(0)',
            opacity: '1'
          },
        },
      },
      backdropBlur: {
        'sm': '4px',
        'lg': '16px',
      }
    },
  },
  plugins: [],
}

