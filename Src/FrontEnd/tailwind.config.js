/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      animation: {
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      colors: {
        brand: {
          50: "#f7f0ff",
          100: "#ede0ff",
          200: "#dcc4ff",
          300: "#c59aff",
          400: "#ad6cff",
          500: "#933bff",
          600: "#7a1ff2",
          700: "#6517c9",
          800: "#5215a2",
          900: "#431582",
        },
        ink: {
          950: "#101820",
        },
      },
    },
  },
  plugins: [],
};
