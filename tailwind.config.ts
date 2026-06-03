import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const squircle = plugin(({ addUtilities }) => {
  addUtilities({
    '.squircle-auto': {
      'corner-shape': 'superellipse(1.5)',
    },
  });
});

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        brand: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          elevated: 'hsl(var(--surface-elevated))',
          muted: 'hsl(var(--surface-muted))',
        },
        aurora: {
          purple: '#A855F7',
          cyan: '#22D3EE',
          blue: '#60A5FA',
          pink: '#F472B6',
          green: '#22C55E',
        },
        mira: {
          bg: 'hsl(var(--background))',
          surface: 'hsl(var(--card))',
          green: '#22C55E',
          'green-dark': '#16A34A',
          'green-deep': '#15803D',
          black: '#0B1220',
          text: '#475569',
          'text-light': '#94A3B8',
          border: 'hsl(var(--border))',
        },
      },
      borderRadius: {
        none: '0',
        sm: 'calc(var(--radius) - 4px)',
        DEFAULT: 'calc(var(--radius) - 2px)',
        md: 'var(--radius)',
        lg: 'calc(var(--radius) + 4px)',
        xl: 'calc(var(--radius) + 8px)',
        '2xl': 'calc(var(--radius) + 16px)',
        '3xl': 'calc(var(--radius) + 24px)',
        '4xl': 'calc(var(--radius) + 32px)',
        '5xl': 'calc(var(--radius) + 48px)',
        full: '9999px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'glass-sm': '0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 2px rgba(15,23,42,0.05)',
        'glass': '0 1px 0 rgba(255,255,255,0.7) inset, 0 8px 32px -8px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)',
        'glass-lg': '0 1px 0 rgba(255,255,255,0.7) inset, 0 16px 48px -12px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.06)',
        'glass-xl': '0 1px 0 rgba(255,255,255,0.8) inset, 0 32px 80px -16px rgba(15,23,42,0.18), 0 8px 16px rgba(15,23,42,0.08)',
        'glow-brand': '0 0 0 1px rgba(34,197,94,0.15), 0 8px 32px -4px rgba(34,197,94,0.35)',
        'glow-brand-lg': '0 0 0 1px rgba(34,197,94,0.18), 0 16px 48px -8px rgba(34,197,94,0.45)',
        'dark-glass': '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 32px -8px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2)',
        'dark-glass-lg': '0 1px 0 rgba(255,255,255,0.08) inset, 0 16px 48px -12px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'aurora-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'count-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-spring',
        'accordion-up': 'accordion-up 0.2s ease-spring',
        'fade-in': 'fade-in 0.4s ease-spring forwards',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'aurora-drift': 'aurora-drift 22s ease-in-out infinite',
        'aurora-drift-slow': 'aurora-drift 40s ease-in-out infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in': 'cubic-bezier(0.32, 0, 0.67, 0)',
        'out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.15)',
        'glass': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary-deep, 158 64% 32%)) 100%)',
        'gradient-radial': 'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.12), transparent 60%)',
        'gradient-mesh': 'radial-gradient(at 20% 20%, rgba(168,85,247,0.15) 0px, transparent 50%), radial-gradient(at 80% 10%, rgba(34,211,238,0.15) 0px, transparent 50%), radial-gradient(at 50% 80%, rgba(96,165,250,0.15) 0px, transparent 50%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },
    },
  },
  plugins: [squircle],
};

export default config;
