import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Cores do Congresso
        congress: {
          primary: '#0077cc',
          secondary: '#60a5fa',
          accent: '#bfdbfe',
          dark: '#3b82f6',
          'dark-primary': '#3b82f6',
          'dark-secondary': '#93c5fd',
          'dark-accent': '#1d4ed8'
        },
        // Cores da Assembleia
        assembly: {
          primary: '#087f5b',
          secondary: '#34d399',
          accent: '#a7f3d0',
          dark: '#10b981',
          'dark-primary': '#10b981',
          'dark-secondary': '#6ee7b7',
          'dark-accent': '#065f46'
        },
        // Cores do Governo
        government: {
          primary: '#e63946',
          secondary: '#f87171',
          accent: '#fecaca',
          dark: '#ef4444',
          'dark-primary': '#ef4444',
          'dark-secondary': '#fca5a5',
          'dark-accent': '#b91c1c'
        },
        // Original color scheme (maintained for compatibility)
        primary: {
          DEFAULT: "#0055CC",
          foreground: "#FFFFFF",
          dark: "#003399",
        },
        border: "hsl(0, 0%, 86%)",
        input: "hsl(0, 0%, 96%)",
        ring: "hsl(214, 95%, 45%)",
        background: "hsl(0, 0%, 100%)",
        foreground: "hsl(0, 0%, 13%)",
        secondary: {
          DEFAULT: "hsl(210, 40%, 96%)",
          foreground: "hsl(222, 47%, 11%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        muted: {
          DEFAULT: "hsl(210, 40%, 96%)",
          foreground: "hsl(215, 16%, 47%)",
        },
        accent: {
          DEFAULT: "hsl(210, 40%, 96%)",
          foreground: "hsl(222, 47%, 11%)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-to-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-to-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-out-to-left": "slide-out-to-left 0.3s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
        "slide-out-to-right": "slide-out-to-right 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
} satisfies Config;
