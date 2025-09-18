// tailwind.config.js (ESM)
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      height: { dvh: '100dvh' },
      colors: { brand: { 50: '#f5f7ff', 500: '#3b82f6', 600: '#2563eb' } },
      boxShadow: { nav: '0 -4px 12px rgba(0,0,0,0.06)' },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      fontFamily: {
        'sans': ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', '"Helvetica Neue"', '"Segoe UI"', '"Apple SD Gothic Neo"', '"Noto Sans KR"', '"Malgun Gothic"', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
