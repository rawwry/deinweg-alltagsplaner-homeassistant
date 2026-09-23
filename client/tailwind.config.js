import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.resolve(__dirname, 'index.html'),
    path.resolve(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, '../shared/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        surface: {
          base: '#0c0b10',
          card: '#15131c',
          elevated: '#1c1926',
          border: '#2a2438',
          muted: '#94a3b8',
          cream: '#f8fafc',
        },
        bistro: {
          amber: '#f59e0b',
          terracotta: '#f97316',
          rose: '#f43f5e',
          sage: '#10b981',
        },
        waste: {
          yellow: '#eab308',
          bio: '#78350f',
          paper: '#0284c7',
          rest: '#64748b',
        },
        brand: {
          magenta: '#e11d48',
          pink: '#f43f5e',
          rose: '#ec4899',
          fuchsia: '#d946ef',
          light: '#fda4af',
        },
        primary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        theme: {
          DEFAULT: 'var(--theme-primary)',
          primary: 'var(--theme-primary)',
          hover: 'var(--theme-primary-hover)',
          accent: 'var(--theme-accent)',
          subtle: 'var(--theme-subtle)',
          border: 'var(--theme-border)',
          text: 'var(--theme-text)',
          from: 'var(--theme-from)',
          to: 'var(--theme-to)',
          glow: 'var(--theme-glow)',
        },
      },
    },
  },
  plugins: [],
};

