/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'retro-purple': {
          DEFAULT: '#1a0933',
          dark: '#0d041a',
          light: '#2d124d',
        },
        'neon-pink': '#ff007f',
        'neon-cyan': '#00f0ff',
        'ectoplasm': '#39ff14',
        'gold-coin': '#ffd700',
      },
      fontFamily: {
        'retro': ['"Press Start 2P"', 'monospace', 'sans-serif'],
        'sans': ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-pink': '0 0 10px #ff007f, 0 0 20px #ff007f',
        'neon-cyan': '0 0 10px #00f0ff, 0 0 20px #00f0ff',
        'neon-green': '0 0 10px #39ff14, 0 0 20px #39ff14',
      }
    },
  },
  plugins: [],
}
