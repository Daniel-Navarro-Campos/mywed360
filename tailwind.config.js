export default {
  // Estrategia de modo oscuro por clase
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  // Using class strategy for dark mode
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      fontSize: { '2xl': ['1.875rem', { lineHeight: '2.25rem' }] },
      colors: {
    'pastel-yellow': '#FFF9DB',
        'pastel-blue': '#DBF0FF',
        'pastel-pink': '#FFE4F2',
        'pastel-green': '#E0FFE0',
        'pastel-purple': '#F0E0FF',
        'pastel-orange': '#FFE0C0',
        blue: {
          50: '#DBF0FF',
          100: '#C4E6FF',
          500: '#8ACBFF',
          600: '#5EBBFF',
          700: '#2E8CD8',
        },
     } } },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};