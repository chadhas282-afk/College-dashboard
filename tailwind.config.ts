import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Neon accents — used for glows, gradients and small highlights only.
        neon: {
          cyan: '#22d3ee',
          blue: '#3b82f6',
          magenta: '#f0abfc',
          pink: '#f472b6',
          lime: '#a3e635',
          amber: '#fbbf24',
          violet: '#a78bfa',
        },
        // Dark surface ramp for the retro-futurist shell.
        void: {
          950: '#04060f',
          900: '#070b1a',
          850: '#0b1124',
          800: '#111a33',
          700: '#1a2547',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'neon-sm': '0 0 12px -2px rgb(34 211 238 / 0.45)',
        neon: '0 0 24px -4px rgb(34 211 238 / 0.5)',
        'neon-lg': '0 0 48px -8px rgb(34 211 238 / 0.45)',
        'neon-magenta': '0 0 24px -4px rgb(240 171 252 / 0.5)',
        glass: '0 8px 32px -8px rgb(0 0 0 / 0.6)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(148,163,184,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.06) 1px, transparent 1px)',
        'grid-bright':
          'linear-gradient(rgba(34,211,238,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.10) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '44px 44px',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'border-spin': {
          '0%': { '--angle': '0deg' },
          '100%': { '--angle': '360deg' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        scanline: 'scanline 9s linear infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;