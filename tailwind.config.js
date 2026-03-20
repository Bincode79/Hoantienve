/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        card: 'var(--bg-card)',
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0284c7', // Sky 600
          600: '#0369a1', // Sky 700
          700: '#1e3a8a', // Deep Navy (Blue 900)
          800: '#1e3a8a',
          900: '#0f172a', // Slate 900
          950: '#020617', // Slate 950
          gradient: 'linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%)',
        },
        neutral: {
          50: '#fcfdfe',
          100: '#f8fafc',
          200: '#f1f5f9',
          300: '#e2e8f0',
          400: '#cbd5e1',
          500: '#94a3b8',
          600: '#64748b',
          700: '#475569',
          800: '#1e293b',
          900: '#0f172a',
          950: '#030712', // Deep Rich Ink
        },
        accent: {
          soft: '#fdf4ff',
          400: '#facc15', // Solar Gold
          500: '#eab308', 
          600: '#ca8a04',
          premium: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
        },
        warning: {
          50: '#fffbeb',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fff1f2',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      fontSize: {
        'fluid-xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
        'fluid-sm': ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5' }],
        'fluid-base': ['clamp(0.9375rem, 0.875rem + 0.3125vw, 1.0625rem)', { lineHeight: '1.6' }],
        'fluid-lg': ['clamp(1.125rem, 1rem + 0.625vw, 1.25rem)', { lineHeight: '1.5' }],
        'fluid-xl': ['clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', { lineHeight: '1.4' }],
        'fluid-2xl': ['clamp(1.5rem, 1.25rem + 1.25vw, 2rem)', { lineHeight: '1.3' }],
        'fluid-3xl': ['clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)', { lineHeight: '1.2' }],
        'fluid-4xl': ['clamp(2.25rem, 1.75rem + 2.5vw, 3rem)', { lineHeight: '1.1' }],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0,0,0,0.04)',
        'sm': '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.03)',
        'md': '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.03)',
        'lg': '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.03)',
        'xl': '0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.03)',
        '2xl': '0 25px 50px -12px rgba(0,0,0,0.1)',
        'inner': 'inset 0 2px 4px 0 rgba(0,0,0,0.04)',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
      },
    },
  },
  plugins: [],
}
