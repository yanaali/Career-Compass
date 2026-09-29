/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amber: {
          50: "#fef9f0",
          100: "#fde8cf",
          200: "#fbd089",
          300: "#f9b34d",
          400: "#f5991f",
          500: "#ea8317",
          600: "#c9590f",
          700: "#a1430d",
        },
        sage: {
          50: "#f6f9f7",
          100: "#e4ebe6",
          200: "#d0ddd3",
          300: "#a8bfae",
          400: "#7fa686",
          500: "#6b956d",
          600: "#5a8459",
          700: "#4b6a49",
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
        warm: "0 8px 24px rgba(234, 131, 23, 0.12)"
      },
      backgroundImage: {
        "gradient-cozy": "linear-gradient(135deg, #fef9f0 0%, #f6f9f7 50%, #fef9f0 100%)",
        "gradient-cozy-dark": "linear-gradient(135deg, #1e1b16 0%, #1a1f1d 50%, #1e1b16 100%)"
      }
    }
  },
  plugins: []
};
