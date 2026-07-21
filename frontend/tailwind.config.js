/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#0c0c0c",
          prompt: "#00ff66",
          text: "#e0e0e0",
          dim: "#686868",
          error: "#ff5555",
          success: "#50fa7b",
          link: "#8be9fd"
        }
      },
      fontFamily: {
        mono: ['"Roboto Mono"', '"Fira Code"', '"Courier New"', 'monospace'],
      }
    },
  },
  plugins: [],
}
