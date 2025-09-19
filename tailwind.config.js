/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Brand Colors
      colors: {
        // Primary Brand Colors
        brand: {
          navy: '#001F3F',
          orange: '#FF6B6B', 
          pink: '#FF2D95',
          purple: '#913D88',
          gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF2D95 50%, #913D88 100%)',
        },
        // Semantic Colors with Brand Touch
        primary: {
          50: '#fef2f2',
          100: '#fee2e2', 
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#FF6B6B', // Brand orange
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#FF2D95', // Brand pink
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#913D88', // Brand purple
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Success, Warning, Error with Brand Alignment
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0', 
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
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
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      // Typography - Roboto as primary
      fontFamily: {
        'sans': ['Roboto', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Monaco', 'Cascadia Code', 'Segoe UI Mono', 'monospace'],
        'brand': ['Roboto', 'system-ui', 'sans-serif'],
      },
      // Extended spacing for better design consistency
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      // Custom animations
      animation: {
        'gradient': 'gradient 3s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // Custom backgrounds
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(135deg, #FF6B6B 0%, #FF2D95 50%, #913D88 100%)',
        'hero-pattern': "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF2D95' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
      },
      // Box shadows with brand colors
      boxShadow: {
        'brand': '0 10px 25px -5px rgba(255, 45, 149, 0.2), 0 4px 6px -2px rgba(255, 45, 149, 0.1)',
        'brand-lg': '0 20px 40px -10px rgba(255, 45, 149, 0.3), 0 8px 16px -4px rgba(255, 45, 149, 0.2)',
      },
      // Custom border radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      // Custom backdrop blur
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    // Add custom utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.text-gradient': {
          'background': 'linear-gradient(135deg, #FF6B6B 0%, #FF2D95 50%, #913D88 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.bg-brand-gradient': {
          'background': 'linear-gradient(135deg, #FF6B6B 0%, #FF2D95 50%, #913D88 100%)',
        },
        '.bg-brand-gradient-hover': {
          'background': 'linear-gradient(135deg, #FF6B6B 0%, #FF2D95 50%, #913D88 100%)',
          'background-size': '200% 200%',
          'transition': 'background-position 0.3s ease',
        },
        '.bg-brand-gradient-hover:hover': {
          'background-position': '100% 0%',
        },
        // Haiti flag gradient (for cultural elements)
        '.bg-haiti-gradient': {
          'background': 'linear-gradient(to bottom, #0072CE 0%, #0072CE 50%, #CE1126 50%, #CE1126 100%)',
        },
      };
      addUtilities(newUtilities);
    },
    // Custom scrollbar styles
    function({ addBase }) {
      addBase({
        // Custom scrollbar
        '::-webkit-scrollbar': {
          width: '8px',
        },
        '::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF2D95 50%, #913D88 100%)',
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: 'linear-gradient(135deg, #FF5555 0%, #FF1D85 50%, #813378 100%)',
        },
        // Dark mode scrollbar
        '.dark ::-webkit-scrollbar-track': {
          background: '#374151',
        },
        // Focus styles for better accessibility
        '*:focus-visible': {
          outline: '2px solid #FF2D95',
          outlineOffset: '2px',
        },
        // Selection styles with brand colors
        '::selection': {
          background: '#FF2D95',
          color: 'white',
        },
        '::-moz-selection': {
          background: '#FF2D95',
          color: 'white',
        },
      });
    },
  ],
};
