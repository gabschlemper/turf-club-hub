import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        ink: "#1a1a1a",
        primary: {
          DEFAULT: "#f97316",
          dark: "#ea580c",
          light: "#fff7ed",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
