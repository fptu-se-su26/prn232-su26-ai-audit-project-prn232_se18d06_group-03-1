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
          50: "#f8f3ff",
          100: "#f0e7ff",
          200: "#dfceff",
          300: "#caa6ff",
          400: "#b36eff",
          500: "#9a35ff",
          600: "#8118f5",
          700: "#6a12d2",
          800: "#5413a5",
          900: "#441486",
          950: "#27064f",
        },
        ink: {
          950: "#101820",
        },
      },
    },
  },
  plugins: [],
};
