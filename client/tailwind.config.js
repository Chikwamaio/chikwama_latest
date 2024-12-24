/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  important: "#root",
  theme: {
    extend: {
      colors: {
        primary: '#7C067C'
      }
    },
    fontFamily:{
      sans:['Montserat','sans-serif']
    }
  },
  plugins: [],
}