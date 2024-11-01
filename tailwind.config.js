/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'Proxima Nova', 'sans-serif'],
    },
    extend: {
      spacing: {
        '8xl': '96rem',
        '9xl': '128rem',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
  daisyui: {
    themes: [{
      theme: {
        "primary": "#002e73",
        "secondary": "#602bff",
        "accent": "#454500",
        "neutral": "#312840",
        "base-100": "#ebd567",
        "info": "#ffffff",
        "success": "#22c55e",
        "warning": "#fbbf24",
        "error": "#f87171",
      }
    }]
  },
  plugins: [require("daisyui")],
}