export const tokens = {
    fonts: {
      primary: 'var(--font-sans, Inter, system-ui, sans-serif)',
      mono: 'var(--font-mono, monospace)',
    },
    spacing: {
      xs: '0.25rem',    // 4px
      sm: '0.5rem',     // 8px
      md: '1rem',       // 16px
      lg: '1.5rem',     // 24px
      xl: '2rem',       // 32px
      '2xl': '2.5rem',  // 40px
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    radius: {
      sm: 'var(--radius)',
      md: 'calc(var(--radius) * 1.5)',
      lg: 'calc(var(--radius) * 2)',
      full: '9999px',
    },
  };