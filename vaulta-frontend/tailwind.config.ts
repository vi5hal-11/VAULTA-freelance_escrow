import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Satoshi', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: {
          DEFAULT: 'hsl(var(--bg-primary))',
          secondary: 'hsl(var(--bg-secondary))',
          tertiary: 'hsl(var(--bg-tertiary))',
        },
        primary: {
          DEFAULT: 'hsl(var(--accent-primary))',
          muted: 'hsl(var(--accent-primary) / 0.1)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--accent-secondary))',
          muted: 'hsl(var(--accent-secondary) / 0.1)',
        },
        status: {
          success: 'hsl(var(--status-success))',
          warning: 'hsl(var(--status-warning))',
          error: 'hsl(var(--status-error))',
          info: 'hsl(var(--status-info))',
        },
        text: {
          primary: 'hsl(var(--text-primary))',
          muted: 'hsl(var(--text-muted))',
          dim: 'hsl(var(--text-dim))',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-main': 'linear-gradient(135deg, hsl(var(--accent-primary)) 0%, hsl(var(--accent-secondary)) 100%)',
        'glass-gradient': 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.05) 0%, hsla(0, 0%, 100%, 0) 100%)',
      },
      boxShadow: {
        'premium': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-primary': '0 0 20px hsla(245, 80%, 65%, 0.2)',
        'glow-secondary': '0 0 20px hsla(270, 85%, 65%, 0.2)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'float': 'float 6s ease-in-out infinite',
        'slow-bg': 'slow-bg 15s ease infinite alternate',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slow-bg': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config

