/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './index.tsx', './App.tsx', './components/**/*.tsx'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Role-based palette: "white" is always foreground and "black" is always
        // background, so flipping the CSS variables inverts the whole site.
        white: 'rgb(var(--fg) / <alpha-value>)',
        black: 'rgb(var(--bg) / <alpha-value>)',
        gray: {
          100: 'rgb(var(--g100) / <alpha-value>)',
          200: 'rgb(var(--g200) / <alpha-value>)',
          300: 'rgb(var(--g300) / <alpha-value>)',
          400: 'rgb(var(--g400) / <alpha-value>)',
          500: 'rgb(var(--g500) / <alpha-value>)',
          600: 'rgb(var(--g600) / <alpha-value>)',
          700: 'rgb(var(--g700) / <alpha-value>)',
          800: 'rgb(var(--g800) / <alpha-value>)',
          900: 'rgb(var(--g900) / <alpha-value>)',
        },
        'mono-base': 'rgb(var(--bg) / <alpha-value>)',
        'mono-paper': 'rgb(var(--panel) / <alpha-value>)',
        'mono-light': 'rgb(var(--fg) / <alpha-value>)',
        'mono-glass': 'rgb(var(--fg) / 0.03)',
        'mono-border': 'rgb(var(--fg) / 0.1)',
        'mono-accent': 'rgb(var(--accent) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
        display: ['Syne', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        appear: 'appear 1.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        appear: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
