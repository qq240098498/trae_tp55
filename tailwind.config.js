/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F3D30',
          50: '#E8F0EC',
          100: '#C5D7CE',
          200: '#9DBEAE',
          300: '#74A48E',
          400: '#529075',
          500: '#2F7B5C',
          600: '#0F3D30',
          700: '#0C3228',
          800: '#092820',
          900: '#061D18',
        },
        gold: {
          DEFAULT: '#C9A962',
          50: '#FBF7EF',
          100: '#F4ECD6',
          200: '#E7D6AE',
          300: '#DAC085',
          400: '#CDA962',
          500: '#C9A962',
          600: '#A88843',
          700: '#846933',
          800: '#604A24',
          900: '#3D2F17',
        },
        coral: {
          DEFAULT: '#FF6B4A',
          50: '#FFF0EC',
          100: '#FFD9CF',
          200: '#FFB39E',
          300: '#FF8D6E',
          400: '#FF6B4A',
          500: '#FF4A20',
          600: '#E0370E',
          700: '#AD2B0B',
          800: '#7A1F08',
          900: '#4D1305',
        },
        cream: {
          DEFAULT: '#F5F1E8',
          50: '#FDFBF7',
          100: '#FAF6ED',
          200: '#F5F1E8',
          300: '#EDE6D6',
          400: '#E0D5BB',
          500: '#D1C19B',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          50: '#F0F0F0',
          100: '#D9D9D9',
          200: '#B3B3B3',
          300: '#8C8C8C',
          400: '#666666',
          500: '#404040',
          600: '#1A1A1A',
          700: '#141414',
          800: '#0F0F0F',
          900: '#0A0A0A',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'tick': 'tick 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        tick: {
          '0%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        }
      },
      boxShadow: {
        'card': '0 4px 24px -8px rgba(15, 61, 48, 0.15)',
        'card-hover': '0 12px 40px -12px rgba(15, 61, 48, 0.25)',
        'gold': '0 4px 20px -4px rgba(201, 169, 98, 0.35)',
        'inner-soft': 'inset 0 2px 8px rgba(15, 61, 48, 0.06)',
      }
    },
  },
  plugins: [],
};
