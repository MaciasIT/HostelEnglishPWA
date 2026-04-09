/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2c3e50',
          dark: '#1a252f',
          light: '#7f8c8d',
        },
        accent: {
          DEFAULT: '#f39c12',
          dark: '#e67e22',
        },
      },
      borderRadius: {
        'sm-token': '1rem',
        'md-token': '1.5rem',
        'lg-token': '2rem',
      },
    },
  },
  plugins: [],
};
