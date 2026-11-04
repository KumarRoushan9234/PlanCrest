/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Primary font for body, UI, forms, etc.
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Secondary font for headings (h1, h2, h3, etc.)
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
