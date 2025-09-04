/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2c3e50', // Un azul oscuro y profesional
          dark: '#1a252f',
        },
        accent: {
          DEFAULT: '#f39c12', // Un naranja vibrante
          dark: '#e67e22',
        },
      },
    },
  },
  plugins: [],
};
