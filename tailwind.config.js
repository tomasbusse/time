/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Modern responsive breakpoints (mobile-first)
    screens: {
      'xs': '475px',    // Extra small devices
      'sm': '640px',    // Small devices (landscape phones)
      'md': '768px',    // Medium devices (tablets)
      'lg': '1024px',   // Large devices (desktops)
      'xl': '1280px',   // Extra large devices
      '2xl': '1536px',  // 2X large devices
    },
    extend: {
      colors: {
        'border-border': "hsl(var(--border))",
        'light-gray': '#DDDEE3',
        'dark-blue': '#384C5A',
        'gray': '#B6B2B5',
        'brown': '#A78573',
        'custom-brown': '#A78573',
        'off-white': '#F1F5EE',
        'off-white0': '#A78573', // Custom brown accent color
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      // Container with responsive padding
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
    },
  },
  plugins: [],
}
