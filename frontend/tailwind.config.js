/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deepspace: {
          DEFAULT: '#0a0a1a',
          900: '#0a0a1a',
          950: '#0d1230',
        },
        accent: {
          purple: '#6c63ff',
          cyan: '#00d4ff',
        },
        gold: {
          pro: '#f0c040',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        indigo: {
          DEFAULT: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        violet: {
          DEFAULT: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        fuchsia: {
          DEFAULT: '#d946ef',
          600: '#c026d3',
        }
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        dm: ['var(--font-dm-sans)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
