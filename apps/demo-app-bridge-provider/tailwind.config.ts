import type { Config } from 'tailwindcss'

export default {
  prefix: 'tw-',
  content: ['./src/**/*.{ts,tsx,css}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--tw-background) / <alpha-value>)',
        foreground: 'hsl(var(--tw-foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--tw-primary) / <alpha-value>)',
          foreground: 'hsl(var(--tw-primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--tw-secondary) / <alpha-value>)',
          foreground: 'hsl(var(--tw-secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--tw-muted) / <alpha-value>)',
          foreground: 'hsl(var(--tw-muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--tw-accent) / <alpha-value>)',
          foreground: 'hsl(var(--tw-accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--tw-destructive) / <alpha-value>)',
          foreground: 'hsl(var(--tw-destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--tw-border) / <alpha-value>)',
        input: 'hsl(var(--tw-input) / <alpha-value>)',
        ring: 'hsl(var(--tw-ring) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--tw-card) / <alpha-value>)',
          foreground: 'hsl(var(--tw-card-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--tw-radius)',
        md: 'calc(var(--tw-radius) - 2px)',
        sm: 'calc(var(--tw-radius) - 4px)',
      },
    },
  },
} satisfies Config