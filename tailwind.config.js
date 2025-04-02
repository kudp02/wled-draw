/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  // In Tailwind v4, darkMode is configured differently
  darkMode: ["selector", ".dark"],
  plugins: [],
};
