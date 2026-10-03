/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        glass: "rgba(255,255,255,0.05)",
      },
      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [],
};
