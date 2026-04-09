import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#030712',
        surface: {
          DEFAULT: '#0C1220',
          raised: '#111827',
          overlay: '#161F32',
        },
        ink: {
          DEFAULT: '#F9FAFB',
          muted: '#9CA3AF',
          faint: '#4B5563',
        },
        cyan: {
          400: '#22D3EE',
          500: '#06B6D4',
        },
        indigo: {
          400: '#818CF8',
          500: '#6366F1',
        },
        ember: {
          400: '#FB923C',
          500: '#F97316',
        },
        jade: {
          400: '#34D399',
          500: '#10B981',
        },
        rose: {
          400: '#F87171',
          500: '#EF4444',
        },
        amber: {
          400: '#FBBF24',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          strong: 'rgba(255,255,255,0.12)',
        },
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.25), 0 0 40px rgba(34, 211, 238, 0.1)',
        'glow-indigo': '0 0 20px rgba(129, 140, 248, 0.25)',
        'glow-ember': '0 0 20px rgba(251, 146, 60, 0.25)',
        'card': '0 1px 3px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config