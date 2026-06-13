/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        panel: "#131722",
        panel2: "#1a2030",
        accent: "#7c5cff",
        accent2: "#22d3ee",
        good: "#22c55e",
        bad: "#ef4444",
        text: "#e6e8ef",
        muted: "#8a93a6",
      },
    },
  },
  plugins: [],
};
