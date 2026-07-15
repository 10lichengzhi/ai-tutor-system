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
        // 使用CSS变量实现主题切换（RGB格式，支持alpha透明度）
        'bg-primary': 'rgb(var(--bg-primary) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--bg-secondary) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'border-theme': 'rgb(var(--border-color) / <alpha-value>)',
        'accent-theme': 'rgb(var(--accent-color) / <alpha-value>)',
        // 主色调（枣红色护眼主题 #993222）
        primary: {
          50: '#fdf2f0',
          100: '#fbe2de',
          200: '#f8c8c0',
          300: '#f2a396',
          400: '#e87460',
          500: '#d94f3a',
          600: '#c43824',
          700: '#a32c1c',
          800: '#87271b',
          900: '#70241c',
          950: '#3d0f0b',
        },
        // 辅助色（金色系，搭配中式红）
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // 强调色（墨绿色系）
        accent: {
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
          950: '#052e16',
        },
      },
      fontFamily: {
        sans: ['"Microsoft YaHei"', '"微软雅黑"', '"PingFang SC"', '"Hiragino Sans GB"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        // 玻璃拟态阴影 - 更柔和更深
        'glass': '0 8px 32px rgba(0, 0, 0, 0.2)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.3)',
        'glass-hover': '0 16px 48px rgba(0, 0, 0, 0.35)',
        'glass-inner': 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'glass-glow': '0 0 20px rgba(153, 50, 34, 0.15)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '20px',
        '2xl': '30px',
        '3xl': '40px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #993222 0%, #7a2818 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradientShift 15s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
}
