// tailwind.config.js (ESM)
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      height: { dvh: '100dvh' },
      colors: { brand: { 50: '#f5f7ff', 500: '#3b82f6', 600: '#2563eb' } },
      boxShadow: { nav: '0 -4px 12px rgba(0,0,0,0.06)' },
    },
  },
  plugins: [],
}
