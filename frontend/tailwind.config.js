/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Vaporwave palette — gardée en CSS vars aussi pour Phaser
        'vapor-bg': '#1a0b2e',
        'vapor-bg-mid': '#2d1b4e',
        'vapor-pink': '#ff71ce',
        'vapor-pink-soft': '#ffb3e0',
        'vapor-cyan': '#01cdfe',
        'vapor-purple': '#b967ff',
        'vapor-yellow': '#fffb96',
        'vapor-white': '#fff8fc',
      },
      fontFamily: {
        display: ['"VT323"', 'monospace'],
        body: ['"Space Mono"', 'monospace'],
        jp: ['"Noto Serif JP"', 'serif'],
      },
      boxShadow: {
        'neon-pink': '0 0 20px #ff71ce, 0 0 40px #ff71ce80',
        'neon-cyan': '0 0 20px #01cdfe, 0 0 40px #01cdfe80',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 3s linear infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
    },
  },
  plugins: [],
};
