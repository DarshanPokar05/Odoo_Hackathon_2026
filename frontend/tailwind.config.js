/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surfaceAlt: 'var(--surface-alt)',
        'surface-alt': 'var(--surface-alt)',
        border: 'var(--border)',
        textPrimary: 'var(--text-primary)',
        'text-primary': 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        'text-secondary': 'var(--text-secondary)',
        accent: 'var(--accent)',
        accentSoft: 'var(--accent-soft)',
        'accent-soft': 'var(--accent-soft)',
        status: {
          available: 'var(--status-available)',
          allocated: 'var(--status-allocated)',
          reserved: 'var(--status-reserved)',
          maintenance: 'var(--status-maintenance)',
          lost: 'var(--status-lost)',
          retired: 'var(--status-retired)',
          overdue: 'var(--status-overdue)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        console: '8px',
        chip: '2px',
      },
    },
  },
  plugins: [],
};
